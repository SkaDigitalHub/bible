// dictionary.js
class BibleDictionary {
    constructor() {
        this.hebrewData = null;
        this.greekData = null;
        this.allEntries = [];
        this.filteredEntries = [];
        this.favorites = new Set();
        this.recentSearches = [];
        
        // DOM elements
        this.elements = {};
        
        // Initialize
        this.init();
    }
    
    async init() {
        try {
            // Load saved state
            this.loadSavedState();
            
            // Initialize DOM
            this.initializeDOMElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load XML data
            await this.loadXMLData();
            
            // Update UI
            this.updateUI();
            
            this.showToast('Bible Dictionary loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to initialize Dictionary:', error);
            this.showToast('Error loading dictionary data', 'error');
        }
    }
    
    initializeDOMElements() {
        // Get all DOM elements
        this.elements = {
            // Search
            searchInput: document.getElementById('dictionary-search'),
            searchBtn: document.getElementById('dictionary-search-btn'),
            searchStats: document.getElementById('dictionary-stats'),
            
            // Filters
            filterType: document.getElementById('filter-type'),
            filterAlphabet: document.getElementById('filter-alphabet'),
            sortSelect: document.getElementById('sort-select'),
            
            // Display
            dictionaryEntries: document.getElementById('dictionaryEntries'),
            alphabetNav: document.getElementById('alphabetNav'),
            noResults: document.getElementById('noResults'),
            
            // Stats
            totalTerms: document.getElementById('total-terms'),
            currentFilter: document.getElementById('current-filter'),
            viewingStats: document.getElementById('viewing-stats'),
            dictionaryProgress: document.getElementById('dictionary-progress'),
            dictionaryProgressFill: document.getElementById('dictionary-progress-fill'),
            
            // Side menu
            sideMenu: document.getElementById('sideMenu'),
            menuOverlay: document.getElementById('menuOverlay'),
            menuToggle: document.getElementById('menuToggle'),
            closeMenu: document.getElementById('closeMenu'),
            
            // Recent & Favorites
            recentSearchesList: document.getElementById('recent-searches'),
            favoriteTermsList: document.getElementById('favorite-terms'),
            
            // Modal
            entryModal: document.getElementById('entryModal'),
            modalTerm: document.getElementById('modal-term'),
            modalType: document.getElementById('modal-type'),
            modalDefinition: document.getElementById('modal-definition'),
            modalReferences: document.getElementById('modal-references'),
            modalRelated: document.getElementById('modal-related'),
            modalPronunciation: document.getElementById('modal-pronunciation'),
            modalOriginal: document.getElementById('modal-original'),
            
            // Buttons
            favoriteBtn: document.getElementById('favoriteBtn'),
            copyEntryBtn: document.getElementById('copyEntryBtn'),
            shareEntryBtn: document.getElementById('shareEntryBtn'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            viewFavoritesBtn: document.getElementById('viewFavoritesBtn'),
            categoryTags: document.querySelectorAll('.category-tag'),
            
            // Toast
            toast: document.getElementById('toast')
        };
    }
    
    async loadXMLData() {
        try {
            // Load Hebrew Strong's XML
            const hebrewResponse = await fetch('bible/dic/strong_hebrew.xml');
            const hebrewText = await hebrewResponse.text();
            this.hebrewData = this.parseStrongsXML(hebrewText, 'hebrew');
            
            // Load Greek Strong's XML
            const greekResponse = await fetch('bible/dic/strong_greek.xml');
            const greekText = await greekResponse.text();
            this.greekData = this.parseStrongsXML(greekText, 'greek');
            
            // Combine and process all entries
            this.processAllEntries();
            
            console.log(`Loaded ${this.allEntries.length} dictionary entries`);
            
        } catch (error) {
            console.error('Error loading XML data:', error);
            throw error;
        }
    }
    
    parseStrongsXML(xmlText, language) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const entries = [];
        const divElements = xmlDoc.getElementsByTagName('div');
        
        for (let div of divElements) {
            if (div.getAttribute('type') === 'entry') {
                const entry = this.parseEntryElement(div, language);
                if (entry) {
                    entries.push(entry);
                }
            }
        }
        
        return entries;
    }
    
    parseEntryElement(divElement, language) {
        try {
            const entryId = divElement.getAttribute('n');
            const strongId = language === 'hebrew' ? `H${entryId}` : `G${entryId}`;
            
            // Get the word element
            const wordElement = divElement.getElementsByTagName('w')[0];
            if (!wordElement) return null;
            
            // Extract data from attributes
            const originalWord = wordElement.textContent || '';
            const transliteration = wordElement.getAttribute('xlit') || '';
            const pronunciation = wordElement.getAttribute('POS') || '';
            const lemma = wordElement.getAttribute('lemma') || '';
            const morph = wordElement.getAttribute('morph') || '';
            
            // Get definition from list items
            const definitionItems = [];
            const list = divElement.getElementsByTagName('list')[0];
            if (list) {
                const items = list.getElementsByTagName('item');
                for (let item of items) {
                    definitionItems.push(item.textContent);
                }
            }
            
            // Get Greek references for Hebrew entries
            const greekReferences = [];
            if (language === 'hebrew') {
                const foreign = divElement.getElementsByTagName('foreign')[0];
                if (foreign) {
                    const greekWords = foreign.getElementsByTagName('w');
                    for (let gw of greekWords) {
                        const gloss = gw.getAttribute('gloss');
                        if (gloss && gloss.startsWith('G:')) {
                            greekReferences.push(gloss.substring(2));
                        }
                    }
                }
            }
            
            // Create entry object
            return {
                id: strongId,
                number: parseInt(entryId),
                original: originalWord,
                transliteration: transliteration,
                pronunciation: pronunciation,
                lemma: lemma,
                morphology: morph,
                definition: definitionItems,
                language: language,
                greekReferences: greekReferences,
                gloss: wordElement.getAttribute('gloss') || '',
                searchText: `${originalWord} ${transliteration} ${pronunciation} ${lemma}`.toLowerCase()
            };
            
        } catch (error) {
            console.error('Error parsing entry:', error);
            return null;
        }
    }
    
    processAllEntries() {
        // Combine Hebrew and Greek entries
        this.allEntries = [
            ...(this.hebrewData || []),
            ...(this.greekData || [])
        ];
        
        // Sort by Strong's number
        this.allEntries.sort((a, b) => a.number - b.number);
        
        // Update alphabet navigation
        this.populateAlphabetNavigation();
        
        // Initial display
        this.filteredEntries = [...this.allEntries];
    }
    
    populateAlphabetNavigation() {
        if (!this.elements.alphabetNav) return;
        
        // Clear existing
        this.elements.alphabetNav.innerHTML = '';
        
        // Add "All" button
        const allBtn = document.createElement('button');
        allBtn.className = 'alphabet-letter active';
        allBtn.dataset.letter = 'all';
        allBtn.textContent = 'All';
        allBtn.onclick = () => this.filterByAlphabet('all');
        this.elements.alphabetNav.appendChild(allBtn);
        
        // Get unique first letters from transliterations
        const letters = new Set();
        this.allEntries.forEach(entry => {
            if (entry.transliteration) {
                const firstLetter = entry.transliteration.charAt(0).toUpperCase();
                if (/[A-Z]/.test(firstLetter)) {
                    letters.add(firstLetter);
                }
            }
        });
        
        // Sort letters
        const sortedLetters = Array.from(letters).sort();
        
        // Create letter buttons
        sortedLetters.forEach(letter => {
            const letterBtn = document.createElement('button');
            letterBtn.className = 'alphabet-letter';
            letterBtn.dataset.letter = letter;
            letterBtn.textContent = letter;
            letterBtn.onclick = () => this.filterByAlphabet(letter);
            this.elements.alphabetNav.appendChild(letterBtn);
        });
    }
    
    filterByAlphabet(letter) {
        // Update active state
        document.querySelectorAll('.alphabet-letter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.letter === letter);
        });
        
        // Filter entries
        if (letter === 'all') {
            this.filteredEntries = [...this.allEntries];
        } else {
            this.filteredEntries = this.allEntries.filter(entry => 
                entry.transliteration && 
                entry.transliteration.charAt(0).toUpperCase() === letter
            );
        }
        
        // Update filter display
        this.elements.currentFilter.textContent = letter === 'all' ? 'All Terms' : `Letter ${letter}`;
        
        // Re-apply current search/sort
        this.applyCurrentFilters();
    }
    
    filterByType(type) {
        if (type === 'all') {
            this.filteredEntries = [...this.allEntries];
        } else {
            this.filteredEntries = this.allEntries.filter(entry => 
                entry.language === type
            );
        }
        
        // Update filter display
        this.elements.currentFilter.textContent = type === 'all' ? 'All Terms' : 
            type === 'hebrew' ? 'Hebrew Terms' : 'Greek Terms';
        
        this.applyCurrentFilters();
    }
    
    searchDictionary(query) {
        if (!query || !query.trim()) {
            this.filteredEntries = [...this.allEntries];
            this.applyCurrentFilters();
            return;
        }
        
        const searchTerm = query.trim().toLowerCase();
        
        // Add to recent searches
        this.addToRecentSearches(searchTerm);
        
        // Search through entries
        this.filteredEntries = this.allEntries.filter(entry => {
            return (
                entry.original.toLowerCase().includes(searchTerm) ||
                entry.transliteration.toLowerCase().includes(searchTerm) ||
                entry.pronunciation.toLowerCase().includes(searchTerm) ||
                entry.lemma.toLowerCase().includes(searchTerm) ||
                entry.definition.some(def => def.toLowerCase().includes(searchTerm))
            );
        });
        
        // Sort by relevance (simple implementation)
        this.filteredEntries.sort((a, b) => {
            const aScore = this.calculateRelevance(a, searchTerm);
            const bScore = this.calculateRelevance(b, searchTerm);
            return bScore - aScore;
        });
        
        this.applyCurrentFilters();
        
        // Update search stats
        this.updateSearchStats(searchTerm);
    }
    
    calculateRelevance(entry, searchTerm) {
        let score = 0;
        
        // Exact match in original word
        if (entry.original.toLowerCase() === searchTerm) score += 100;
        
        // Exact match in transliteration
        if (entry.transliteration.toLowerCase() === searchTerm) score += 80;
        
        // Contains in original word
        if (entry.original.toLowerCase().includes(searchTerm)) score += 50;
        
        // Contains in transliteration
        if (entry.transliteration.toLowerCase().includes(searchTerm)) score += 30;
        
        // Contains in pronunciation
        if (entry.pronunciation.toLowerCase().includes(searchTerm)) score += 20;
        
        // Contains in definition
        entry.definition.forEach(def => {
            if (def.toLowerCase().includes(searchTerm)) score += 10;
        });
        
        return score;
    }
    
    updateSearchStats(searchTerm) {
        if (!this.elements.searchStats) return;
        
        if (!searchTerm || searchTerm.trim() === '') {
            this.elements.searchStats.innerHTML = `
                <div>Showing <strong>${this.filteredEntries.length}</strong> of <strong>${this.allEntries.length}</strong> entries</div>
            `;
            return;
        }
        
        this.elements.searchStats.innerHTML = `
            <div>
                Found <strong>${this.filteredEntries.length}</strong> result${this.filteredEntries.length !== 1 ? 's' : ''} 
                for "<strong>${searchTerm}</strong>"
            </div>
            <button id="clear-search-btn" class="clear-search-btn" title="Clear search">
                <i class="fas fa-times"></i> Clear
            </button>
        `;
        
        // Add event listener to clear button
        const clearBtn = document.getElementById('clear-search-btn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                this.elements.searchInput.value = '';
                this.searchDictionary('');
            };
        }
    }
    
    applyCurrentFilters() {
        // Apply sorting
        const sortBy = this.elements.sortSelect?.value || 'name-asc';
        this.sortEntries(sortBy);
        
        // Update display
        this.displayEntries();
        
        // Update stats
        this.updateDisplayStats();
    }
    
    sortEntries(sortBy) {
        switch(sortBy) {
            case 'name-asc':
                this.filteredEntries.sort((a, b) => 
                    a.transliteration.localeCompare(b.transliteration)
                );
                break;
                
            case 'name-desc':
                this.filteredEntries.sort((a, b) => 
                    b.transliteration.localeCompare(a.transliteration)
                );
                break;
                
            case 'relevance':
                // Already sorted by relevance in search
                break;
                
            case 'type':
                this.filteredEntries.sort((a, b) => 
                    a.language.localeCompare(b.language)
                );
                break;
                
            default:
                this.filteredEntries.sort((a, b) => a.number - b.number);
        }
    }
    
    displayEntries() {
        if (!this.elements.dictionaryEntries) return;
        
        this.elements.dictionaryEntries.innerHTML = '';
        
        if (this.filteredEntries.length === 0) {
            this.elements.noResults.style.display = 'block';
            return;
        }
        
        this.elements.noResults.style.display = 'none';
        
        this.filteredEntries.forEach(entry => {
            const entryElement = this.createEntryElement(entry);
            this.elements.dictionaryEntries.appendChild(entryElement);
        });
    }
    
    createEntryElement(entry) {
        const div = document.createElement('div');
        div.className = 'dictionary-entry';
        div.dataset.id = entry.id;
        
        const isFavorite = this.favorites.has(entry.id);
        
        // Create preview text (first definition item)
        const previewText = entry.definition.length > 0 
            ? entry.definition[0].substring(0, 150) + (entry.definition[0].length > 150 ? '...' : '')
            : 'No definition available';
        
        div.innerHTML = `
            <div class="entry-header">
                <div>
                    <div class="entry-title">${entry.transliteration || entry.original}</div>
                    <div class="entry-subtitle">
                        <span class="entry-id">${entry.id}</span>
                        ${entry.original ? `<span class="entry-original">${entry.original}</span>` : ''}
                    </div>
                </div>
                <div class="entry-type-badge ${entry.language}">${entry.language.toUpperCase()}</div>
            </div>
            
            <div class="entry-preview">
                ${this.escapeHtml(previewText)}
            </div>
            
            <div class="entry-footer">
                <div class="entry-references">
                    <i class="fas fa-book"></i>
                    <span>${entry.definition.length} definition${entry.definition.length !== 1 ? 's' : ''}</span>
                </div>
                <button class="entry-favorite-btn ${isFavorite ? 'favorited' : ''}" 
                        data-id="${entry.id}"
                        title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-star"></i>
                </button>
            </div>
        `;
        
        // Add click event to open modal
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.entry-favorite-btn')) {
                this.openEntryModal(entry);
            }
        });
        
        // Add favorite button event
        const favBtn = div.querySelector('.entry-favorite-btn');
        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(entry.id);
                favBtn.classList.toggle('favorited');
                favBtn.querySelector('i').className = favBtn.classList.contains('favorited') 
                    ? 'fas fa-star' 
                    : 'far fa-star';
                favBtn.title = favBtn.classList.contains('favorited') 
                    ? 'Remove from favorites' 
                    : 'Add to favorites';
            });
        }
        
        return div;
    }
    
    openEntryModal(entry) {
        if (!this.elements.entryModal) return;
        
        // Update modal content
        this.elements.modalTerm.textContent = entry.transliteration || entry.original;
        this.elements.modalType.textContent = entry.language.toUpperCase();
        this.elements.modalType.className = `entry-type-badge ${entry.language}`;
        
        // Update definition
        const definitionHtml = entry.definition.map(item => 
            `<div class="definition-item">${this.escapeHtml(item)}</div>`
        ).join('');
        this.elements.modalDefinition.innerHTML = definitionHtml;
        
        // Update pronunciation
        if (entry.pronunciation) {
            this.elements.modalPronunciation.textContent = entry.pronunciation;
            this.elements.pronunciationSection.style.display = 'block';
        } else {
            this.elements.pronunciationSection.style.display = 'none';
        }
        
        // Update original language
        if (entry.original) {
            let originalText = entry.original;
            if (entry.language === 'hebrew') {
                originalText += ` (Hebrew)`;
            } else if (entry.language === 'greek') {
                originalText += ` (Greek)`;
            }
            this.elements.modalOriginal.textContent = originalText;
            this.elements.originalLanguageSection.style.display = 'block';
        } else {
            this.elements.originalLanguageSection.style.display = 'none';
        }
        
        // Update Greek references (for Hebrew entries)
        if (entry.language === 'hebrew' && entry.greekReferences.length > 0) {
            const referencesHtml = entry.greekReferences.map(ref => 
                `<span class="bible-ref" data-ref="G${ref}">G${ref}</span>`
            ).join('');
            this.elements.modalReferences.innerHTML = referencesHtml;
            this.elements.bibleReferencesSection.style.display = 'block';
        } else {
            this.elements.bibleReferencesSection.style.display = 'none';
        }
        
        // Update favorite button
        const isFavorite = this.favorites.has(entry.id);
        this.elements.favoriteBtn.classList.toggle('active', isFavorite);
        this.elements.favoriteBtn.querySelector('i').className = isFavorite 
            ? 'fas fa-star' 
            : 'far fa-star';
        this.elements.favoriteBtn.title = isFavorite 
            ? 'Remove from favorites' 
            : 'Add to favorites';
        
        // Set up favorite button event
        this.elements.favoriteBtn.onclick = () => {
            this.toggleFavorite(entry.id);
            const newIsFavorite = this.favorites.has(entry.id);
            this.elements.favoriteBtn.classList.toggle('active', newIsFavorite);
            this.elements.favoriteBtn.querySelector('i').className = newIsFavorite 
                ? 'fas fa-star' 
                : 'far fa-star';
            this.elements.favoriteBtn.title = newIsFavorite 
                ? 'Remove from favorites' 
                : 'Add to favorites';
        };
        
        // Set up copy button
        this.elements.copyEntryBtn.onclick = () => {
            this.copyEntryToClipboard(entry);
        };
        
        // Set up share button
        this.elements.shareEntryBtn.onclick = () => {
            this.shareEntry(entry);
        };
        
        // Show modal
        this.elements.entryModal.classList.add('active');
    }
    
    toggleFavorite(entryId) {
        if (this.favorites.has(entryId)) {
            this.favorites.delete(entryId);
            this.showToast('Removed from favorites', 'success');
        } else {
            this.favorites.add(entryId);
            this.showToast('Added to favorites', 'success');
        }
        
        this.saveState();
        this.updateFavoritesList();
    }
    
    addToRecentSearches(searchTerm) {
        // Remove if already exists
        this.recentSearches = this.recentSearches.filter(s => s.term !== searchTerm);
        
        // Add to beginning
        this.recentSearches.unshift({
            term: searchTerm,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        
        // Keep only last 10
        if (this.recentSearches.length > 10) {
            this.recentSearches.pop();
        }
        
        this.updateRecentSearchesList();
        this.saveState();
    }
    
    updateRecentSearchesList() {
        if (!this.elements.recentSearchesList) return;
        
        this.elements.recentSearchesList.innerHTML = '';
        
        if (this.recentSearches.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No recent searches';
            this.elements.recentSearchesList.appendChild(emptyState);
            return;
        }
        
        this.recentSearches.forEach(search => {
            const item = document.createElement('div');
            item.className = 'recent-search-item';
            item.innerHTML = `
                <span class="recent-search-term">${this.escapeHtml(search.term)}</span>
                <span class="recent-search-time">${search.time}</span>
            `;
            
            item.onclick = () => {
                this.elements.searchInput.value = search.term;
                this.searchDictionary(search.term);
            };
            
            this.elements.recentSearchesList.appendChild(item);
        });
    }
    
    updateFavoritesList() {
        if (!this.elements.favoriteTermsList) return;
        
        this.elements.favoriteTermsList.innerHTML = '';
        
        const favoriteEntries = this.allEntries.filter(entry => 
            this.favorites.has(entry.id)
        );
        
        if (favoriteEntries.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No favorite terms yet';
            this.elements.favoriteTermsList.appendChild(emptyState);
            return;
        }
        
        favoriteEntries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'favorite-term-item';
            item.innerHTML = `
                <span class="favorite-term-name">${entry.transliteration || entry.original}</span>
                <span class="favorite-term-type">${entry.id}</span>
            `;
            
            item.onclick = () => {
                this.openEntryModal(entry);
                this.closeSideMenu();
            };
            
            this.elements.favoriteTermsList.appendChild(item);
        });
    }
    
    updateDisplayStats() {
        if (!this.elements.totalTerms) return;
        
        this.elements.totalTerms.textContent = this.allEntries.length;
        this.elements.viewingStats.textContent = 
            `${this.filteredEntries.length} of ${this.allEntries.length} entries`;
        
        // Update progress bar (simple example)
        const progressPercent = Math.min(100, 
            (this.filteredEntries.length / this.allEntries.length) * 100
        );
        if (this.elements.dictionaryProgressFill) {
            this.elements.dictionaryProgressFill.style.width = `${progressPercent}%`;
        }
        
        if (this.elements.dictionaryProgress) {
            this.elements.dictionaryProgress.textContent = 
                `Viewing ${Math.round(progressPercent)}% of dictionary`;
        }
    }
    
    copyEntryToClipboard(entry) {
        const text = this.formatEntryForClipboard(entry);
        
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Entry copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showToast('Failed to copy', 'error');
        });
    }
    
    formatEntryForClipboard(entry) {
        return `
${entry.id}: ${entry.transliteration} (${entry.original})
Language: ${entry.language.toUpperCase()}
Pronunciation: ${entry.pronunciation}
Transliteration: ${entry.transliteration}
Lemma: ${entry.lemma}

Definition:
${entry.definition.map((item, i) => `${i + 1}. ${item}`).join('\n')}

${entry.greekReferences.length > 0 ? `Greek References: ${entry.greekReferences.map(r => 'G' + r).join(', ')}` : ''}
        `.trim();
    }
    
    shareEntry(entry) {
        const text = this.formatEntryForClipboard(entry);
        
        if (navigator.share) {
            navigator.share({
                title: `${entry.id} - ${entry.transliteration}`,
                text: text.substring(0, 100) + '...',
                url: window.location.href
            }).catch(err => {
                console.log('Share cancelled:', err);
            });
        } else {
            this.copyEntryToClipboard(entry);
        }
    }
    
    setupEventListeners() {
        // Search
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchDictionary(this.elements.searchInput.value);
                }
            });
        }
        
        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', () => {
                this.searchDictionary(this.elements.searchInput.value);
            });
        }
        
        // Filters
        if (this.elements.filterType) {
            this.elements.filterType.addEventListener('change', (e) => {
                this.filterByType(e.target.value);
            });
        }
        
        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', () => {
                this.applyCurrentFilters();
            });
        }
        
        // Category tags
        this.elements.categoryTags?.forEach(tag => {
            tag.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.filterByType(type);
                
                // Update active state
                this.elements.categoryTags.forEach(t => 
                    t.classList.toggle('active', t === e.target)
                );
            });
        });
        
        // Side menu
        if (this.elements.menuToggle) {
            this.elements.menuToggle.addEventListener('click', () => this.openSideMenu());
        }
        
        if (this.elements.closeMenu) {
            this.elements.closeMenu.addEventListener('click', () => this.closeSideMenu());
        }
        
        if (this.elements.menuOverlay) {
            this.elements.menuOverlay.addEventListener('click', () => this.closeSideMenu());
        }
        
        // Clear history
        if (this.elements.clearHistoryBtn) {
            this.elements.clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Clear all search history?')) {
                    this.recentSearches = [];
                    this.updateRecentSearchesList();
                    this.saveState();
                    this.showToast('Search history cleared', 'success');
                }
            });
        }
        
        // View favorites
        if (this.elements.viewFavoritesBtn) {
            this.elements.viewFavoritesBtn.addEventListener('click', () => {
                this.filteredEntries = this.allEntries.filter(entry => 
                    this.favorites.has(entry.id)
                );
                this.applyCurrentFilters();
                this.showToast('Showing favorite terms', 'success');
            });
        }
        
        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeEntryModal());
        });
        
        // Close modal on overlay click
        if (this.elements.entryModal) {
            this.elements.entryModal.addEventListener('click', (e) => {
                if (e.target === this.elements.entryModal) {
                    this.closeEntryModal();
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEntryModal();
                this.closeSideMenu();
            }
        });
    }
    
    openSideMenu() {
        if (this.elements.sideMenu) {
            this.elements.sideMenu.classList.add('active');
        }
        if (this.elements.menuOverlay) {
            this.elements.menuOverlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }
    
    closeSideMenu() {
        if (this.elements.sideMenu) {
            this.elements.sideMenu.classList.remove('active');
        }
        if (this.elements.menuOverlay) {
            this.elements.menuOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }
    
    closeEntryModal() {
        if (this.elements.entryModal) {
            this.elements.entryModal.classList.remove('active');
        }
    }
    
    updateUI() {
        this.displayEntries();
        this.updateDisplayStats();
        this.updateRecentSearchesList();
        this.updateFavoritesList();
        this.updateSearchStats('');
    }
    
    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showToast(message, type = 'success') {
        if (!this.elements.toast) return;
        
        this.elements.toast.textContent = message;
        this.elements.toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, 3000);
    }
    
    loadSavedState() {
        try {
            const savedFavorites = localStorage.getItem('dictionary-favorites');
            if (savedFavorites) {
                this.favorites = new Set(JSON.parse(savedFavorites));
            }
            
            const savedRecent = localStorage.getItem('dictionary-recent');
            if (savedRecent) {
                this.recentSearches = JSON.parse(savedRecent);
            }
            
        } catch (error) {
            console.error('Error loading saved state:', error);
        }
    }
    
    saveState() {
        try {
            localStorage.setItem('dictionary-favorites', 
                JSON.stringify(Array.from(this.favorites)));
            localStorage.setItem('dictionary-recent', 
                JSON.stringify(this.recentSearches));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }
}

// Initialize the dictionary
document.addEventListener('DOMContentLoaded', () => {
    const dictionary = new BibleDictionary();
    window.bibleDictionary = dictionary;

});
