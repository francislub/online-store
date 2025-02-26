export function generateIsoFormattedDate(normalDate) {
    const dateObject = new Date(normalDate);

        const isoFormattedDate = dateObject.toISOString();

        return isoFormattedDate;
}