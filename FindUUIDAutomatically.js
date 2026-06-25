function findUUIDLocation(targetValue) {
    // 1. Setup Modes & Matchers
    const isValueSearch = !!targetValue;
    const searchValue = isValueSearch ? targetValue.toLowerCase() : null;
    
    // Common keys to look for if no target is provided
    const userKeys = ['username', 'user_name', 'email', 'user', 'userid', 'user_id', 'profile', 'account', 'login', 'currentuser', 'displayname'];

    // Helper: Checks if a key contains any of our common user strings (Case-Insensitive)
    function matchesKey(keyName) {
        if (!keyName || typeof keyName !== 'string') return false;
        const lowerKey = keyName.toLowerCase();
        return userKeys.some(uk => lowerKey.includes(uk));
    }

    // Helper: Checks if a value matches our target string (Case-Insensitive)
    function matchesValue(val) {
        if (!val || typeof val !== 'string') return false;
        return val.toLowerCase().includes(searchValue);
    }

    if (isValueSearch) {
        console.log(`%c Initiating case-insensitive scan for value: "${targetValue}"...`, "color: #007BFF; font-weight: bold; font-size: 14px;");
    } else {
        console.log(`%c No target provided. Initiating discovery scan for common user/account keys...`, "color: #9C27B0; font-weight: bold; font-size: 14px;");
    }

    let foundLocations = [];

    // 2. Scan Local Storage
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        let val = localStorage.getItem(key);
        
        if (isValueSearch) {
            if (matchesValue(val)) foundLocations.push(`[Local Storage] Key: '${key}'`);
        } else {
            if (matchesKey(key)) foundLocations.push(`[Local Storage] Key: '${key}' => Value: ${val}`);
        }
    }

    // 3. Scan Session Storage
    for (let i = 0; i < sessionStorage.length; i++) {
        let key = sessionStorage.key(i);
        let val = sessionStorage.getItem(key);
        
        if (isValueSearch) {
            if (matchesValue(val)) foundLocations.push(`[Session Storage] Key: '${key}'`);
        } else {
            if (matchesKey(key)) foundLocations.push(`[Session Storage] Key: '${key}' => Value: ${val}`);
        }
    }

    // 4. Scan Cookies
    if (document.cookie) {
        let cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            let [key, val] = cookie.trim().split('=');
            if (isValueSearch) {
                if (matchesValue(cookie)) {
                    foundLocations.push(`[Cookie] Key: '${key}'`);
                }
            } else {
                if (matchesKey(key)) {
                    foundLocations.push(`[Cookie] Key: '${key}' => Value: ${val}`);
                }
            }
        });
    }

    // 5. Scan Window Object (Memory/Global Variables)
    const visited = new Set(); // Tracks visited objects to prevent infinite loops

    function searchGlobalObject(obj, path, depth) {
        if (depth > 3) return; // Limits depth to 3 levels to prevent browser freezing
        if (obj == null || typeof obj !== 'object') return;
        if (visited.has(obj)) return;

        // Skip DOM Nodes and the main window reference inside objects to avoid native code loops
        if (obj instanceof Node || (obj instanceof Window && path !== 'window')) return;

        visited.add(obj);

        for (let key in obj) {
            try {
                let val = obj[key];
                let currentPath = path === 'window' ? `window.${key}` : `${path}.${key}`;

                // If running Key Discovery, log if the object's property name matches
                if (!isValueSearch && matchesKey(key)) {
                    let displayVal = (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') ? val : '{object}';
                    foundLocations.push(`[Window Variable] Path: ${currentPath} => Value: ${displayVal}`);
                }

                // If running Value Search, log if the string matches
                if (isValueSearch && typeof val === 'string' && matchesValue(val)) {
                    foundLocations.push(`[Window Variable] Path: ${currentPath}`);
                } else if (typeof val === 'object' && val !== null) {
                    if (isValueSearch) {
                        // Quick stringify check optimization for value searches
                        try {
                            let strVal = JSON.stringify(val);
                            if (strVal && strVal.toLowerCase().includes(searchValue)) {
                                searchGlobalObject(val, currentPath, depth + 1);
                            }
                        } catch(e) {
                            searchGlobalObject(val, currentPath, depth + 1);
                        }
                    } else {
                        // If key searching, continue digging into the object naturally
                        searchGlobalObject(val, currentPath, depth + 1);
                    }
                }
            } catch(e) {
                // Silently ignore cross-origin or security access errors
            }
        }
    }

    // Start the Window Object search
    for (let key in window) {
        try {
            if (key === 'localStorage' || key === 'sessionStorage') continue;

            let val = window[key];
            
            if (!isValueSearch && matchesKey(key)) {
                 let displayVal = (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') ? val : '{object}';
                 foundLocations.push(`[Window Variable] Path: window.${key} => Value: ${displayVal}`);
            }

            if (isValueSearch && typeof val === 'string' && matchesValue(val)) {
                 foundLocations.push(`[Window Variable] Path: window.${key}`);
            } else if (typeof val === 'object' && val !== null) {
                 searchGlobalObject(val, `window.${key}`, 1);
            }
        } catch(e) {}
    }

    // 6. Print Final Results
    if (foundLocations.length > 0) {
        console.log(`%c Scan Complete! Found ${foundLocations.length} match(es):`, "color: #28A745; font-weight: bold; font-size: 14px;");
        foundLocations.forEach(loc => console.log(` ${loc}`));
    } else {
        console.log(`%c Scan Complete. No matches found.`, "color: #DC3545; font-weight: bold; font-size: 14px;");
        if (isValueSearch) {
            console.log("Note: If it's not here, it is likely being fetched dynamically via an API response and isn't stored in global memory.");
        }
    }
}

// How to use 
// Run this in the target console to find the UUID location in the application
findUUIDLocation(
    //pass your argument here
    )

    /*
    Note that you will have to pass the argument if 
    you know by what user name has been used to log into the 
    application 

    Else leaving it empty will simply do the brute search 
    for potential UUID location which might not be true always
    */