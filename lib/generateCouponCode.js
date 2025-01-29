const generateCouponCode = (title, expiryDate) => {
    const formattedTitle = title.toUpperCase().replace(/\s+/g,'');

    const formatedExpiryDate = expiryDate.toISOString().slice(0,10).split('-').reverse().join('');

    const couponCode = `${formattedTitle}-${formatedExpiryDate}`;

    return couponCode;
};