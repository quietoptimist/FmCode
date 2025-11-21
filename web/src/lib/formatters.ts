export function formatName(name: string): string {
    if (!name) return name;
    // Insert space between lowercase and uppercase letters
    const words = name.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Capitalize the first letter
    return words.charAt(0).toUpperCase() + words.slice(1);
}
