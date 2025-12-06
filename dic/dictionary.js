// dictionary.js - Complete Fixed Version
class BibleDictionary {
    constructor() {
        this.hebrewData = null;
        this.greekData = null;
        this.allEntries = [];
        this.filteredEntries = [];
        this.favorites = new Set();
        this.recentSearches = [];
        this.currentLanguage = 'all'; // 'all', 'hebrew', or 'greek'
        
        // DOM elements
        this.elements = {};
        
        // Initialize
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing Bible Dictionary...');
            
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
            
            console.log('Dictionary initialization complete');
            this.showToast('Bible Dictionary loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to initialize Dictionary:', error);
            this.showToast('Error loading dictionary data', 'error');
        }
    }
    
    initializeDOMElements() {
        console.log('Initializing DOM elements...');
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
        
        // Get language-specific sections from modal
        this.elements.pronunciationSection = document.getElementById('pronunciation-section');
        this.elements.originalLanguageSection = document.getElementById('original-language-section');
        this.elements.bibleReferencesSection = document.getElementById('bible-references-section');
        this.elements.relatedTermsSection = document.getElementById('related-terms-section');
    }
    
    async loadXMLData() {
        try {
            console.log('Loading XML data...');
            
            // Load Hebrew Strong's XML
            console.log('Loading Hebrew XML...');
            const hebrewResponse = await fetch('strong_hebrew.xml');
            const hebrewText = await hebrewResponse.text();
            this.hebrewData = this.parseStrongsXML(hebrewText, 'hebrew');
            console.log(`Loaded ${this.hebrewData?.length || 0} Hebrew entries`);
            
            // Load Greek Strong's XML  
            console.log('Loading Greek XML...');
            const greekResponse = await fetch('strong_greek.xml');
            const greekText = await greekResponse.text();
            this.greekData = this.parseStrongsXML(greekText, 'greek');
            console.log(`Loaded ${this.greekData?.length || 0} Greek entries`);
            
            // Combine and process all entries
            this.processAllEntries();
            
            console.log(`Total entries: ${this.allEntries.length}`);
            console.log('Sample Hebrew entry:', this.allEntries.find(e => e.language === 'hebrew'));
            console.log('Sample Greek entry:', this.allEntries.find(e => e.language === 'greek'));
            
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
        
        console.log(`Found ${divElements.length} div elements for ${language}`);
        
        for (let div of divElements) {
            if (div.getAttribute('type') === 'entry') {
                const entry = this.parseEntryElement(div, language);
                if (entry) {
                    entries.push(entry);
                }
            }
        }
        
        console.log(`Parsed ${entries.length} valid entries for ${language}`);
        return entries;
    }
    
    parseEntryElement(divElement, language) {
        try {
            const entryId = divElement.getAttribute('n');
            if (!entryId) {
                console.warn('No entry ID found');
                return null;
            }
            
            const strongId = language === 'hebrew' ? `H${entryId}` : `G${entryId}`;
            
            // Get the word element - handle both Hebrew and Greek structures
            let wordElement = divElement.getElementsByTagName('w')[0];
            
            // For Greek, sometimes it's inside a foreign tag
            if (!wordElement && language === 'greek') {
                const foreignElements = divElement.getElementsByTagName('foreign');
                if (foreignElements.length > 0) {
                    wordElement = foreignElements[0].getElementsByTagName('w')[0];
                }
            }
            
            if (!wordElement) {
                console.warn(`No word element found for ${strongId}`);
                return null;
            }
            
            // Extract data from attributes
            const originalWord = wordElement.textContent?.trim() || '';
            const transliteration = wordElement.getAttribute('xlit') || 
                                   wordElement.getAttribute('lemma') || '';
            const pronunciation = wordElement.getAttribute('POS') || '';
            const lemma = wordElement.getAttribute('lemma') || '';
            const morph = wordElement.getAttribute('morph') || '';
            
            // Get definition from list items
            const definitionItems = [];
            const list = divElement.getElementsByTagName('list')[0];
            if (list) {
                const items = list.getElementsByTagName('item');
                for (let item of items) {
                    const text = item.textContent?.trim();
                    if (text) definitionItems.push(text);
                }
            }
            
            // For Hebrew entries, get Greek references
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
            
            // For Greek entries, get Hebrew references (some Greek XML might have them)
            const hebrewReferences = [];
            if (language === 'greek') {
                const foreign = divElement.getElementsByTagName('foreign')[0];
                if (foreign) {
                    const hebrewWords = foreign.getElementsByTagName('w');
                    for (let hw of hebrewWords) {
                        const gloss = hw.getAttribute('gloss');
                        if (gloss && gloss.startsWith('H:')) {
                            hebrewReferences.push(gloss.substring(2));
                        }
                    }
                }
            }
            
            // Create entry object
            const entry = {
                id: strongId,
                number: parseInt(entryId),
                original: originalWord,
                transliteration: transliteration || strongId, // Fallback to ID if no transliteration
                pronunciation: pronunciation,
                lemma: lemma,
                morphology: morph,
                definition: definitionItems.length > 0 ? definitionItems : ['No definition available'],
                language: language,
                greekReferences: greekReferences,
                hebrewReferences: hebrewReferences,
                gloss: wordElement.getAttribute('gloss') || '',
                searchText: `${strongId} ${originalWord} ${transliteration} ${pronunciation} ${lemma}`.toLowerCase()
            };
            
            return entry;
            
        } catch (error) {
            console.error(`Error parsing ${language} entry:`, error);
            console.log('Problematic div:', divElement.outerHTML);
            return null;
        }
    }
    
    processAllEntries() {
        console.log('Processing all entries...');
        
        // Filter out null entries and ensure we have valid data
        const validHebrew = (this.hebrewData || []).filter(entry => entry !== null);
        const validGreek = (this.greekData || []).filter(entry => entry !== null);
        
        console.log(`Valid Hebrew: ${validHebrew.length}, Valid Greek: ${validGreek.length}`);
        
        // Combine Hebrew and Greek entries
        this.allEntries = [...validHebrew, ...validGreek];
        
        // Sort by Strong's number
        this.allEntries.sort((a, b) => a.number - b.number);
        
        // Update alphabet navigation
        this.populateAlphabetNavigation();
        
        // Initial display - show all entries
        this.filteredEntries = [...this.allEntries];
        
        // Update language stats
        this.updateLanguageStats();
        
        console.log(`Total valid entries: ${this.allEntries.length}`);
    }
    
    updateLanguageStats() {
        if (!this.allEntries || this.allEntries.length === 0) {
            console.warn('No entries to count');
            return;
        }
        
        const hebrewCount = this.allEntries.filter(e => e.language === 'hebrew').length;
        const greekCount = this.allEntries.filter(e => e.language === 'greek').length;
        
        console.log(`Language stats: ${hebrewCount} Hebrew, ${greekCount} Greek`);
        
        // Update UI elements if they exist
        const hebrewElement = document.getElementById('hebrew-count');
        const greekElement = document.getElementById('greek-count');
        const totalTermsElement = document.getElementById('total-terms');
        
        if (hebrewElement) {
            hebrewElement.textContent = hebrewCount;
            console.log('Updated Hebrew count:', hebrewCount);
        }
        if (greekElement) {
            greekElement.textContent = greekCount;
            console.log('Updated Greek count:', greekCount);
        }
        if (totalTermsElement) {
            totalTermsElement.textContent = this.allEntries.length;
            console.log('Updated total terms:', this.allEntries.length);
        }
        
        // Also update the language filter dropdown
        if (this.elements.filterType) {
            // Make sure options exist
            const hasHebrew = this.elements.filterType.querySelector('option[value="hebrew"]');
            const hasGreek = this.elements.filterType.querySelector('option[value="greek"]');
            
            if (!hasHebrew) {
                const hebrewOption = document.createElement('option');
                hebrewOption.value = 'hebrew';
                hebrewOption.textContent = `Hebrew (${hebrewCount})`;
                this.elements.filterType.appendChild(hebrewOption);
            } else {
                hasHebrew.textContent = `Hebrew (${hebrewCount})`;
            }
            
            if (!hasGreek) {
                const greekOption = document.createElement('option');
                greekOption.value = 'greek';
                greekOption.textContent = `Greek (${greekCount})`;
                this.elements.filterType.appendChild(greekOption);
            } else {
                hasGreek.textContent = `Greek (${greekCount})`;
            }
        }
    }
    
    populateAlphabetNavigation() {
        if (!this.elements.alphabetNav) return;
        
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
            if (entry.transliteration && entry.transliteration.trim()) {
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
        
        console.log(`Alphabet navigation: ${sortedLetters.length} letters`);
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
            this.filteredEntries = this.allEntries.filter(entry => {
                return entry.transliteration && 
                       entry.transliteration.charAt(0).toUpperCase() === letter;
            });
        }
        
        // Update filter display
        if (this.elements.currentFilter) {
            this.elements.currentFilter.textContent = letter === 'all' ? 'All Terms' : `Letter ${letter}`;
        }
        
        // Apply current filters
        this.applyCurrentFilters();
    }
    
    filterByType(type) {
        console.log(`Filtering by type: ${type}`);
        
        // Update current language
        this.currentLanguage = type;
        
        // Update active category tags
        if (this.elements.categoryTags) {
            this.elements.categoryTags.forEach(tag => {
                tag.classList.toggle('active', tag.dataset.type === type);
            });
        }
        
        // Update filter dropdown
        if (this.elements.filterType) {
            this.elements.filterType.value = type;
        }
        
        if (type === 'all') {
            this.filteredEntries = [...this.allEntries];
            if (this.elements.currentFilter) {
                this.elements.currentFilter.textContent = 'All Languages';
            }
        } else {
            this.filteredEntries = this.allEntries.filter(entry => entry.language === type);
            
            if (this.elements.currentFilter) {
                if (type === 'hebrew') {
                    this.elements.currentFilter.textContent = 'Hebrew Terms';
                } else if (type === 'greek') {
                    this.elements.currentFilter.textContent = 'Greek Terms';
                }
            }
        }
        
        console.log(`Filtered to ${this.filteredEntries.length} ${type} entries`);
        
        // Apply current filters
        this.applyCurrentFilters();
        
        // Show toast notification
        const langName = type === 'hebrew' ? 'Hebrew' : 
                        type === 'greek' ? 'Greek' : 'All';
        this.showToast(`Showing ${langName} terms`, 'success');
    }
    
    searchDictionary(query) {
        if (!query || !query.trim()) {
            this.filteredEntries = [...this.allEntries];
            this.applyCurrentFilters();
            return;
        }
        
        const searchTerm = query.trim().toLowerCase();
        console.log(`Searching for: "${searchTerm}"`);
        
        // Add to recent searches
        this.addToRecentSearches(searchTerm);
        
        // Search through entries
        this.filteredEntries = this.allEntries.filter(entry => {
            return (
                (entry.original && entry.original.toLowerCase().includes(searchTerm)) ||
                (entry.transliteration && entry.transliteration.toLowerCase().includes(searchTerm)) ||
                (entry.pronunciation && entry.pronunciation.toLowerCase().includes(searchTerm)) ||
                (entry.lemma && entry.lemma.toLowerCase().includes(searchTerm)) ||
                (entry.definition && entry.definition.some(def => def.toLowerCase().includes(searchTerm)))
            );
        });
        
        console.log(`Found ${this.filteredEntries.length} results`);
        
        // Sort by relevance
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
        
        // Exact match in Strong's ID
        if (entry.id.toLowerCase() === searchTerm) score += 100;
        
        // Exact match in original word
        if (entry.original && entry.original.toLowerCase() === searchTerm) score += 90;
        
        // Exact match in transliteration
        if (entry.transliteration && entry.transliteration.toLowerCase() === searchTerm) score += 80;
        
        // Contains in Strong's ID
        if (entry.id.toLowerCase().includes(searchTerm)) score += 70;
        
        // Contains in original word
        if (entry.original && entry.original.toLowerCase().includes(searchTerm)) score += 50;
        
        // Contains in transliteration
        if (entry.transliteration && entry.transliteration.toLowerCase().includes(searchTerm)) score += 30;
        
        // Contains in pronunciation
        if (entry.pronunciation && entry.pronunciation.toLowerCase().includes(searchTerm)) score += 20;
        
        // Contains in definition
        if (entry.definition) {
            entry.definition.forEach(def => {
                if (def.toLowerCase().includes(searchTerm)) score += 10;
            });
        }
        
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
        const sortBy = this.elements.sortSelect?.value || 'number-asc';
        this.sortEntries(sortBy);
        
        // Update display
        this.displayEntries();
        
        // Update stats
        this.updateDisplayStats();
    }
    
    sortEntries(sortBy) {
        console.log(`Sorting by: ${sortBy}`);
        
        switch(sortBy) {
            case 'number-asc':
                this.filteredEntries.sort((a, b) => a.number - b.number);
                break;
                
            case 'number-desc':
                this.filteredEntries.sort((a, b) => b.number - a.number);
                break;
                
            case 'name-asc':
                this.filteredEntries.sort((a, b) => {
                    const aName = a.transliteration || a.id;
                    const bName = b.transliteration || b.id;
                    return aName.localeCompare(bName);
                });
                break;
                
            case 'name-desc':
                this.filteredEntries.sort((a, b) => {
                    const aName = a.transliteration || a.id;
                    const bName = b.transliteration || b.id;
                    return bName.localeCompare(aName);
                });
                break;
                
            case 'language':
                this.filteredEntries.sort((a, b) => {
                    if (a.language === b.language) {
                        return a.number - b.number;
                    }
                    return a.language === 'hebrew' ? -1 : 1;
                });
                break;
                
            default:
                this.filteredEntries.sort((a, b) => a.number - b.number);
        }
    }
    
    displayEntries() {
        if (!this.elements.dictionaryEntries) {
            console.error('Dictionary entries container not found!');
            return;
        }
        
        console.log(`Displaying ${this.filteredEntries.length} entries`);
        
        // Clear the container
        this.elements.dictionaryEntries.innerHTML = '';
        
        if (this.filteredEntries.length === 0) {
            if (this.elements.noResults) {
                this.elements.noResults.style.display = 'block';
            }
            console.log('No entries to display');
            return;
        }
        
        if (this.elements.noResults) {
            this.elements.noResults.style.display = 'none';
        }
        
        // Create and append entry elements
        this.filteredEntries.forEach((entry, index) => {
            if (index < 100) { // Limit display for performance
                const entryElement = this.createEntryElement(entry);
                this.elements.dictionaryEntries.appendChild(entryElement);
            }
        });
        
        // Show message if there are more entries
        if (this.filteredEntries.length > 100) {
            const moreMsg = document.createElement('div');
            moreMsg.className = 'more-results';
            moreMsg.innerHTML = `<p>Showing 100 of ${this.filteredEntries.length} entries. Use search to find specific terms.</p>`;
            this.elements.dictionaryEntries.appendChild(moreMsg);
        }
        
        console.log('Display complete');
    }
    
    createEntryElement(entry) {
        const div = document.createElement('div');
        div.className = 'dictionary-entry';
        div.dataset.id = entry.id;
        div.dataset.language = entry.language;
        
        const isFavorite = this.favorites.has(entry.id);
        
        // Create preview text (first definition item)
        const previewText = entry.definition && entry.definition.length > 0 
            ? entry.definition[0].substring(0, 150) + (entry.definition[0].length > 150 ? '...' : '')
            : 'No definition available';
        
        div.innerHTML = `
            <div class="entry-header">
                <div>
                    <div class="entry-title">${entry.transliteration || entry.id}</div>
                    <div class="entry-subtitle">
                        <span class="entry-id">${entry.id}</span>
                        ${entry.original ? `<span class="entry-original ${entry.language === 'hebrew' ? 'rtl' : ''}">${entry.original}</span>` : ''}
                    </div>
                </div>
                <div class="entry-type-badge ${entry.language}">
                    ${entry.language === 'hebrew' ? 'H' : 'G'}
                </div>
            </div>
            
            <div class="entry-preview">
                ${this.escapeHtml(previewText)}
            </div>
            
            <div class="entry-footer">
                <div class="entry-references">
                    <i class="fas fa-book"></i>
                    <span>${entry.definition ? entry.definition.length : 0} definition${entry.definition && entry.definition.length !== 1 ? 's' : ''}</span>
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
        
        console.log('Opening modal for:', entry.id);
        
        // Update modal content
        this.elements.modalTerm.textContent = entry.transliteration || entry.id;
        this.elements.modalType.textContent = entry.language.toUpperCase();
        this.elements.modalType.className = `entry-type-badge ${entry.language}`;
        
        // Update definition
        const definitionHtml = entry.definition ? entry.definition.map(item => 
            `<div class="definition-item">${this.escapeHtml(item)}</div>`
        ).join('') : '<p>No definition available</p>';
        this.elements.modalDefinition.innerHTML = definitionHtml;
        
        // Update pronunciation
        if (entry.pronunciation && entry.pronunciation.trim()) {
            this.elements.modalPronunciation.textContent = entry.pronunciation;
            if (this.elements.pronunciationSection) {
                this.elements.pronunciationSection.style.display = 'block';
            }
        } else {
            if (this.elements.pronunciationSection) {
                this.elements.pronunciationSection.style.display = 'none';
            }
        }
        
        // Update original language
        if (entry.original && entry.original.trim()) {
            let originalText = entry.original;
            if (entry.language === 'hebrew') {
                originalText = `<span class="rtl">${originalText}</span> (Hebrew)`;
            } else if (entry.language === 'greek') {
                originalText = `<span class="rtl">${originalText}</span> (Greek)`;
            }
            this.elements.modalOriginal.innerHTML = originalText;
            if (this.elements.originalLanguageSection) {
                this.elements.originalLanguageSection.style.display = 'block';
            }
        } else {
            if (this.elements.originalLanguageSection) {
                this.elements.originalLanguageSection.style.display = 'none';
            }
        }
        
        // Update Greek references (for Hebrew entries)
        if (entry.language === 'hebrew' && entry.greekReferences && entry.greekReferences.length > 0) {
            const referencesHtml = entry.greekReferences.map(ref => 
                `<span class="bible-ref" data-ref="G${ref}">G${ref}</span>`
            ).join('');
            this.elements.modalReferences.innerHTML = referencesHtml;
            if (this.elements.bibleReferencesSection) {
                this.elements.bibleReferencesSection.style.display = 'block';
            }
        } else {
            if (this.elements.bibleReferencesSection) {
                this.elements.bibleReferencesSection.style.display = 'none';
            }
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
                <span class="favorite-term-name">${entry.transliteration || entry.id}</span>
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
        
        if (this.elements.viewingStats) {
            this.elements.viewingStats.textContent = 
                `${this.filteredEntries.length} of ${this.allEntries.length} entries`;
        }
        
        // Update progress bar
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
${entry.id}: ${entry.transliteration || entry.id} (${entry.original || 'N/A'})
Language: ${entry.language.toUpperCase()}
Pronunciation: ${entry.pronunciation || 'N/A'}
Transliteration: ${entry.transliteration || 'N/A'}
Lemma: ${entry.lemma || 'N/A'}

Definition:
${entry.definition ? entry.definition.map((item, i) => `${i + 1}. ${item}`).join('\n') : 'No definition available'}

${entry.greekReferences && entry.greekReferences.length > 0 ? 
    `Greek References: ${entry.greekReferences.map(r => 'G' + r).join(', ')}` : ''}
        `.trim();
    }
    
    shareEntry(entry) {
        const text = this.formatEntryForClipboard(entry);
        
        if (navigator.share) {
            navigator.share({
                title: `${entry.id} - ${entry.transliteration || entry.id}`,
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
        console.log('Setting up event listeners...');
        
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
        if (this.elements.categoryTags) {
            this.elements.categoryTags.forEach(tag => {
                tag.addEventListener('click', (e) => {
                    const type = e.target.dataset.type;
                    this.filterByType(type);
                });
            });
        }
        
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
        console.log('Updating UI...');
        this.displayEntries();
        this.updateDisplayStats();
        this.updateRecentSearchesList();
        this.updateFavoritesList();
        this.updateSearchStats('');
        this.updateLanguageStats();
    }
    
    // Utility methods
    escapeHtml(text) {
        if (!text) return '';
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
    console.log('DOM loaded, initializing dictionary...');
    const dictionary = new BibleDictionary();
    window.bibleDictionary = dictionary;
});
