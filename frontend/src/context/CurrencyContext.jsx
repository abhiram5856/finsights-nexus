import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

const SUPPORTED_CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
];

export const CurrencyProvider = ({ children }) => {
    const [selectedCurrency, setSelectedCurrency] = useState(
        localStorage.getItem('selectedCurrency') || 'INR'
    );
    const [exchangeRates, setExchangeRates] = useState({ INR: 1 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const API_BASE = import.meta.env.VITE_API_URL;
                const response = await axios.get(`${API_BASE}/api/stocks/exchange-rates`);
                setExchangeRates(response.data);
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRates();
        // Refresh rates every hour
        const interval = setInterval(fetchRates, 3600000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        localStorage.setItem('selectedCurrency', selectedCurrency);
    }, [selectedCurrency]);

    const value = {
        selectedCurrency,
        setSelectedCurrency,
        exchangeRates,
        isLoading,
        supportedCurrencies: SUPPORTED_CURRENCIES,
        getRate: (code) => exchangeRates[code] || 1,
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
