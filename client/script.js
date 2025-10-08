const API_URL = 'http://localhost:3000/api';
let currentPage = 1;

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'clicks') {
        loadClicks();
    } else if (tabName === 'config') {
        loadCurrentConfig();
    }
}

// Register form handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        sponsor_code: document.getElementById('sponsorCode').value || null
    };

    try {
        const response = await fetch(`${API_URL}/referrals/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('newUserId').textContent = result.user.id;
            document.getElementById('newUserCode').textContent = result.user.referral_code;
            document.getElementById('sponsorInfo').textContent = result.sponsor ? 
                result.sponsor.referral_code : 'None (Root User)';
            
            document.getElementById('registrationResult').style.display = 'block';
            document.getElementById('registerSuccess').style.display = 'block';
            document.getElementById('registerError').style.display = 'none';
            
            // Clear form
            document.getElementById('registerForm').reset();
            
            setTimeout(() => {
                document.getElementById('registerSuccess').style.display = 'none';
            }, 3000);
        } else {
            throw new Error(result.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration Error:', error);
        document.getElementById('registerError').textContent = error.message;
        document.getElementById('registerError').style.display = 'block';
        document.getElementById('registerSuccess').style.display = 'none';
    }
});

// Sponsor code validation
document.getElementById('sponsorCode').addEventListener('blur', async (e) => {
    const code = e.target.value.trim();
    const validationEl = document.getElementById('sponsorValidation');
    
    if (!code) {
        validationEl.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/referrals/validate/${code}`);
        const result = await response.json();
        
        validationEl.style.display = 'block';
        if (result.valid) {
            validationEl.textContent = '✅ Valid sponsor code';
            validationEl.style.color = 'green';
        } else {
            validationEl.textContent = '❌ ' + result.message;
            validationEl.style.color = 'red';
        }
    } catch (error) {
        validationEl.style.display = 'block';
        validationEl.textContent = '❌ Error validating code';
        validationEl.style.color = 'red';
    }
});

// Load referral tree
async function loadReferralTree() {
    const userId = document.getElementById('treeUserId').value.trim();
    
    if (!userId) {
        alert('Please enter a User ID');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/referrals/tree/${userId}`);
        const result = await response.json();

        if (response.ok) {
            // Update stats
            document.getElementById('directReferrals').textContent = result.stats.direct_referrals;
            document.getElementById('totalTeam').textContent = result.stats.total_team_size;
            document.getElementById('activeMembers').textContent = result.stats.active_team_members;

            // Display downline
            displayDownline(result.downline);
            
            // Display upline
            displayUpline(result.upline);

            document.getElementById('treeContainer').style.display = 'block';
        } else {
            throw new Error(result.error || 'Failed to load tree');
        }
    } catch (error) {
        console.error('Tree Load Error:', error);
        alert('Error loading referral tree: ' + error.message);
    }
}

// Display downline
function displayDownline(downline) {
    const container = document.getElementById('downlineList');
    
    if (downline.length === 0) {
        container.innerHTML = '<p>No direct referrals found</p>';
        return;
    }

    let html = '<table><thead><tr><th>Email</th><th>Referral Code</th><th>Rank</th><th>Status</th><th>Joined</th></tr></thead><tbody>';
    
    downline.forEach(member => {
        const user = member.users;
        const status = user.active_status ? 'Active' : 'Inactive';
        const joinedDate = new Date(user.joined_date).toLocaleDateString();
        
        html += `
            <tr>
                <td>${user.email}</td>
                <td><code>${user.referral_code}</code></td>
                <td>${user.rank}</td>
                <td><span class="platform-badge platform-${status.toLowerCase()}">${status}</span></td>
                <td>${joinedDate}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Display upline
function displayUpline(upline) {
    const container = document.getElementById('uplineList');
    
    if (upline.length === 0) {
        container.innerHTML = '<p>No upline found (Root user)</p>';
        return;
    }

    let html = '<table><thead><tr><th>Level</th><th>Email</th><th>Referral Code</th><th>Rank</th><th>Status</th></tr></thead><tbody>';
    
    upline.forEach(member => {
        const user = member.user;
        const status = user.active_status ? 'Active' : 'Inactive';
        
        html += `
            <tr>
                <td>Level ${member.level}</td>
                <td>${user.email}</td>
                <td><code>${user.referral_code}</code></td>
                <td>${user.rank}</td>
                <td><span class="platform-badge platform-${status.toLowerCase()}">${status}</span></td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Generate URL form handler
document.getElementById('generateForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        original_url: document.getElementById('originalUrl').value,
        user_id: document.getElementById('userId').value,
        platform: document.getElementById('platform').value
    };

    try {
        const response = await fetch(`${API_URL}/generate-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('generatedUrl').value = result.modified_url;
            document.getElementById('trackingId').textContent = result.tracking_id;
            document.getElementById('generatedResult').style.display = 'block';
            document.getElementById('generateSuccess').style.display = 'block';
            document.getElementById('generateError').style.display = 'none';
            
            setTimeout(() => {
                document.getElementById('generateSuccess').style.display = 'none';
            }, 3000);
        } else {
            throw new Error(result.error || 'Failed to generate URL');
        }
    } catch (error) {
        console.error('Error generating URL:', error);
        document.getElementById('generateError').textContent = error.message;
        document.getElementById('generateError').style.display = 'block';
        document.getElementById('generateSuccess').style.display = 'none';
    }
});

// Copy URL to clipboard
function copyUrl() {
    const urlInput = document.getElementById('generatedUrl');
    urlInput.select();
    document.execCommand('copy');
    
    const copyBtn = document.querySelector('.btn-copy');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

// Load clicks
async function loadClicks(page = 1) {
    currentPage = page;
    const userId = document.getElementById('filterUserId').value;
    const platform = document.getElementById('filterPlatform').value;

    let url = `${API_URL}/clicks?page=${page}`;
    if (userId) url += `&user_id=${userId}`;
    if (platform) url += `&platform=${platform}`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        displayClicks(result.data);
        updateStats(result.data);
        displayPagination(result.pagination);
    } catch (error) {
        console.error('Error loading clicks:', error);
        document.getElementById('clicksTableContainer').innerHTML = 
            '<p class="error-message" style="display: block;">Failed to load clicks</p>';
    }
}

// Display clicks in table
function displayClicks(clicks) {
    const container = document.getElementById('clicksTableContainer');
    
    if (clicks.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">No clicks found</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>User ID</th>
                    <th>Original URL</th>
                    <th>Tracking ID</th>
                    <th>Platform</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
    `;

    clicks.forEach(click => {
        const platformClass = `platform-${click.platform.toLowerCase()}`;
        const timestamp = new Date(click.timestamp).toLocaleString();
        
        html += `
            <tr>
                <td>${click.user_id.substring(0, 12)}...</td>
                <td class="url-cell" title="${click.original_url}">${click.original_url}</td>
                <td><code>${click.tracking_id}</code></td>
                <td><span class="platform-badge ${platformClass}">${click.platform}</span></td>
                <td>${timestamp}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// Update stats
function updateStats(clicks) {
    document.getElementById('totalClicks').textContent = clicks.length;
    document.getElementById('iosClicks').textContent = 
        clicks.filter(c => c.platform === 'iOS').length;
    document.getElementById('androidClicks').textContent = 
        clicks.filter(c => c.platform === 'Android').length;
}

// Display pagination
function displayPagination(pagination) {
    const container = document.getElementById('pagination');
    let html = '';

    if (pagination.page > 1) {
        html += `<button onclick="loadClicks(${pagination.page - 1})">Previous</button>`;
    }

    html += `<button class="active">${pagination.page} / ${pagination.total_pages}</button>`;

    if (pagination.page < pagination.total_pages) {
        html += `<button onclick="loadClicks(${pagination.page + 1})">Next</button>`;
    }

    container.innerHTML = html;
}

// Clear filters
function clearFilters() {
    document.getElementById('filterUserId').value = '';
    document.getElementById('filterPlatform').value = '';
    loadClicks();
}

// Load current config
async function loadCurrentConfig() {
    try {
        const response = await fetch(`${API_URL}/utm-config`);
        const config = await response.json();

        document.getElementById('currentConfig').innerHTML = `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <p><strong>Source:</strong> ${config.utm_source}</p>
                <p><strong>Medium:</strong> ${config.utm_medium}</p>
                <p><strong>Campaign Prefix:</strong> ${config.utm_campaign_prefix}</p>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    Active since: ${new Date(config.created_at).toLocaleString()}
                </p>
            </div>
        `;

        // Pre-fill form
        document.getElementById('utmSource').value = config.utm_source;
        document.getElementById('utmMedium').value = config.utm_medium;
        document.getElementById('utmCampaignPrefix').value = config.utm_campaign_prefix;
    } catch (error) {
        console.error('Error loading config:', error);
        document.getElementById('currentConfig').innerHTML = 
            '<p class="error-message" style="display: block;">Failed to load configuration</p>';
    }
}

// Handle config form submission
document.getElementById('configForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        utm_source: document.getElementById('utmSource').value,
        utm_medium: document.getElementById('utmMedium').value,
        utm_campaign_prefix: document.getElementById('utmCampaignPrefix').value
    };

    try {
        const response = await fetch(`${API_URL}/utm-config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            document.getElementById('configSuccess').style.display = 'block';
            document.getElementById('configError').style.display = 'none';
            setTimeout(() => {
                document.getElementById('configSuccess').style.display = 'none';
            }, 3000);
            loadCurrentConfig();
        } else {
            throw new Error('Failed to update');
        }
    } catch (error) {
        console.error('Error updating config:', error);
        document.getElementById('configError').style.display = 'block';
        document.getElementById('configSuccess').style.display = 'none';
    }
});
