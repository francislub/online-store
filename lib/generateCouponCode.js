export const generateCouponCode = (title='', expiryDate='') => {
    const formattedTitle = title.toUpperCase().replace(/\s+/g,'');

    const formatedExpiryDate = expiryDate.split('-').reverse().join('');

    const couponCode = `${formattedTitle}-${formatedExpiryDate}`;

    return couponCode;
};