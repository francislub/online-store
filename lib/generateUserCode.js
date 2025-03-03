// lib/generateUserCode.js

export function generateUserCode(prefix, name) {
    if (!name || typeof name !== "string") {
        throw new Error("Invalid name provided");
    }
    
    // Extract first three letters of the name (uppercase)
    const namePart = name.substring(0, 3).toUpperCase();
    
    // Generate a random 4-digit number
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    
    // Combine prefix, namePart, and random number
    return `${prefix}-${namePart}-${randomNumber}`;
}
