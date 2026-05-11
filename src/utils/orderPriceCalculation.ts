// calculate sub total
export const calculateSubTotal = (price: number, quantity: number): number => {
    return price * quantity;
};

export interface DiscountResult {
    amountAfterDiscount: number;
    discountAmount: number;
}

// calculate discount
export const calculateDiscount = (totalAmount: number, discountValue: number): DiscountResult => {
    const actualDiscount = Math.min(totalAmount, discountValue);
    const amountAfterDiscount = totalAmount - actualDiscount;

    return {
        amountAfterDiscount,
        discountAmount: actualDiscount
    };
};

// calculate tax 11%
export const calculateTax = (amountAfterDiscount: number, taxRate = 0.11): number => {
    return Math.round(amountAfterDiscount * taxRate);
};

// calculate grand total
export const calculateGrandTotal = (totalAmount: number, taxValue: number, uniqueCode: number): number => {
    return Math.round(totalAmount + taxValue + uniqueCode);
};