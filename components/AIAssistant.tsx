
import React, { useState, useCallback } from 'react';
import { getGroundedResponse } from '../services/geminiService';
import type { GroundingChunk } from '../types';

const AIAssistant: React.FC = () => {
    const [query, setQuery] = useState('');
    const [useMaps, setUseMaps] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<{ text: string; chunks: GroundingChunk[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<GeolocationPosition | null>(null);

    const handleLocationRequest = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation(position);
                    setUseMaps(true);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setError("Geolocation is required for Maps search. Please enable it in your browser settings.");
                    setUseMaps(false);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
            setUseMaps(false);
        }
    }, []);
    
    const handleToggleMaps = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setUseMaps(isChecked);
        if (isChecked && !location) {
            handleLocationRequest();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            const result = await getGroundedResponse(query, useMaps, location);
            setResponse(result);
        } catch (err) {
            console.error(err);
            setError("An error occurred while fetching the response. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">AI Research Assistant</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Get up-to-date and accurate information using Google Search and Maps.</p>
            <form onSubmit={handleSubmit}>
                <div className="relative mb-4">
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask about recent events, find local places, or research a topic..."
                        className="w-full p-4 pr-12 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        rows={3}
                        disabled={isLoading}
                    />
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <input
                            id="use-maps"
                            type="checkbox"
                            checked={useMaps}
                            onChange={handleToggleMaps}
                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            disabled={isLoading}
                        />
                        <label htmlFor="use-maps" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                           Include local results with Google Maps
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition"
                    >
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {error && <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg">{error}</div>}
            
            {isLoading && (
                 <div className="w-full flex justify-center items-center p-8">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            )}

            {response && (
                <div className="mt-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Response</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{response.text}</div>
                    
                    {response.chunks.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-300">Sources</h4>
                            <ul className="space-y-2">
                                {response.chunks.map((chunk, index) => (
                                    <li key={index} className="p-3 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md">
                                        {chunk.web && (
                                            <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:underline">
                                                <span className="material-symbols-outlined text-base">link</span>
                                                <span className="text-sm font-medium">{chunk.web.title}</span>
                                            </a>
                                        )}
                                        {chunk.maps && (
                                            <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-green-600 dark:text-green-400 hover:underline">
                                                <span className="material-symbols-outlined text-base">map</span>
                                                <span className="text-sm font-medium">{chunk.maps.title}</span>
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIAssistant;
