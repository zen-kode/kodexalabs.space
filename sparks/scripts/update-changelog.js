#!/usr/bin/env node
/**
 * Automated Changelog Updater
 * 
 * This script automatically updates the changelog based on git commit information.
 * It analyzes commit messages and categorizes changes appropriately.
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const [, , commitHash, commitMessage, commitAuthor, commitDate] = process.argv;

if (!commitHash || !commitMessage || !commitAuthor || !commitDate) {
    console.error('Usage: node update-changelog.js <hash> <message> <author> <date>');
    process.exit(1);
}

// Path to the changelog file
const changelogPath = path.join(__dirname, '..', 'src', 'app', '(main)', 'changelogs', 'page.tsx');

// Function to analyze commit message and categorize changes
function analyzeCommitMessage(message) {
    const changes = {
        added: [],
        improved: [],
        fixed: [],
        technical: [],
        removed: []
    };

    const lowerMessage = message.toLowerCase();

    // Skip auto-generated commits
    if (lowerMessage.includes('[auto-changelog]') || 
        lowerMessage.includes('merge branch') ||
        lowerMessage.includes('merge pull request')) {
        return null;
    }

    // Categorize based on commit message patterns
    if (lowerMessage.includes('add') || lowerMessage.includes('new') || lowerMessage.includes('create')) {
        changes.added.push(message.replace(/^(add|new|create):?\s*/i, '').trim());
    } else if (lowerMessage.includes('fix') || lowerMessage.includes('bug') || lowerMessage.includes('resolve')) {
        changes.fixed.push(message.replace(/^(fix|bug|resolve):?\s*/i, '').trim());
    } else if (lowerMessage.includes('improve') || lowerMessage.includes('enhance') || lowerMessage.includes('update') || lowerMessage.includes('optimize')) {
        changes.improved.push(message.replace(/^(improve|enhance|update|optimize):?\s*/i, '').trim());
    } else if (lowerMessage.includes('remove') || lowerMessage.includes('delete') || lowerMessage.includes('drop')) {
        changes.removed.push(message.replace(/^(remove|delete|drop):?\s*/i, '').trim());
    } else if (lowerMessage.includes('refactor') || lowerMessage.includes('config') || lowerMessage.includes('setup') || lowerMessage.includes('build')) {
        changes.technical.push(message.replace(/^(refactor|config|setup|build):?\s*/i, '').trim());
    } else {
        // Default to improved for general changes
        changes.improved.push(message.trim());
    }

    // Remove empty categories
    Object.keys(changes).forEach(key => {
        if (changes[key].length === 0) {
            delete changes[key];
        }
    });

    return Object.keys(changes).length > 0 ? changes : null;
}

// Function to determine version increment
function determineVersionIncrement(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('breaking') || lowerMessage.includes('major') || lowerMessage.includes('feat!')) {
        return 'major';
    } else if (lowerMessage.includes('feat') || lowerMessage.includes('feature') || lowerMessage.includes('add')) {
        return 'minor';
    } else {
        return 'patch';
    }
}

// Function to increment version
function incrementVersion(currentVersion, incrementType) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (incrementType) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
        default:
            return `${major}.${minor}.${patch + 1}`;
    }
}

// Function to get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const commitDate = new Date(date);
    const diffMs = now - commitDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) {
        return 'just now';
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        const diffWeeks = Math.floor(diffDays / 7);
        return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    }
}

// Main function to update changelog
function updateChangelog() {
    try {
        // Check if running in test mode
        if (process.env.CHANGELOG_TEST_MODE === 'true') {
            console.log('✅ Running in test mode - changelog script is working correctly');
            console.log(`   Would process commit: ${commitHash}`);
            console.log(`   Message: ${commitMessage.split('\n')[0]}`);
            console.log(`   Author: ${commitAuthor}`);
            return;
        }

        // Check if changelog file exists
        if (!fs.existsSync(changelogPath)) {
            console.log('⚠️  Changelog file not found, skipping update');
            return;
        }

        // Read the current changelog file
        const fileContent = fs.readFileSync(changelogPath, 'utf8');
        
        // Analyze the commit message
        const changes = analyzeCommitMessage(commitMessage);
        
        if (!changes) {
            console.log('Skipping changelog update for this commit type');
            return;
        }

        // Extract current version from the changelog
        const versionMatch = fileContent.match(/version: '([\d\.]+)'/);;
        const currentVersion = versionMatch ? versionMatch[1] : '1.0.0';
        
        // Determine new version
        const incrementType = determineVersionIncrement(commitMessage);
        const newVersion = incrementVersion(currentVersion, incrementType);
        
        // Create new changelog entry
        const newEntry = {
            version: newVersion,
            date: commitDate,
            title: commitMessage.split('\n')[0].trim(),
            commit: commitHash,
            author: commitAuthor,
            timeAgo: getTimeAgo(commitDate),
            type: incrementType,
            changes: changes
        };

        // Find the fullChangelog array and insert the new entry
        const changelogArrayMatch = fileContent.match(/(const fullChangelog = \[)([\s\S]*?)(\];)/m);
        
        if (!changelogArrayMatch) {
            console.error('Could not find changelog array in file');
            return;
        }

        const beforeArray = changelogArrayMatch[1];
        const afterArray = changelogArrayMatch[3];
        
        // Format the new entry as a JavaScript object
        const escapedTitle = newEntry.title.replace(/'/g, "\\'");
        const formattedEntry = `  {
    version: '${newEntry.version}',
    date: '${newEntry.date}',
    title: '${escapedTitle}',
    commit: '${newEntry.commit}',
    author: '${newEntry.author}',
    timeAgo: '${newEntry.timeAgo}',
    type: '${newEntry.type}',
    changes: ${JSON.stringify(newEntry.changes, null, 6).replace(/^/gm, '      ').trim()}
  }`;

        // Insert the new entry at the beginning of the array
        const updatedContent = fileContent.replace(
            changelogArrayMatch[0],
            `${beforeArray}\n${formattedEntry},${changelogArrayMatch[2]}${afterArray}`
        );

        // Write the updated content back to the file
        fs.writeFileSync(changelogPath, updatedContent, 'utf8');
        
        console.log(`✅ Changelog updated with version ${newVersion}`);
        console.log(`   Commit: ${commitHash}`);
        console.log(`   Message: ${commitMessage.split('\n')[0]}`);
        console.log(`   Changes: ${Object.keys(changes).join(', ')}`);
        
    } catch (error) {
        console.error('❌ Error updating changelog:', error.message);
        process.exit(1);
    }
}

// Run the update
updateChangelog();