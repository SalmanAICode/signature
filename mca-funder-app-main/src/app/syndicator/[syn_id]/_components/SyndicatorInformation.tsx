'use client';

import React from 'react';
import Display from '@/components/Display';
import {
    getBasicInformationConfig,
    getAddressInformationConfig,
    getBusinessInformationConfig,
    getStatisticsConfig,
    getSyndicationOffersConfig,
    getSyndicationAmountsConfig,
    getAssociatedFundersConfig,
    getSystemInformationConfig
} from '../_config/syndicatorSections';

interface SyndicatorInformationProps {
    data: any;
}

// Helper function to check if a section has any actual data to display
const hasValidData = (config: any, data: any): boolean => {
    if (!config || !config.groups || config.groups.length === 0) {
        return false;
    }

    // Helper function to get nested value
    const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    };

    // Check if any group has fields with actual values
    return config.groups.some((group: any) => {
        if (!group.fields || group.fields.length === 0) return false;

        return group.fields.some((field: any) => {
            const value = getNestedValue(data, field.key);

            // Check for meaningful values
            if (value === null || value === undefined || value === '') {
                return false;
            }

            // For arrays, check if they have items
            if (Array.isArray(value)) {
                return value.length > 0;
            }

            // For objects, check if they have meaningful content
            if (typeof value === 'object' && value !== null) {
                return Object.keys(value).length > 0;
            }

            return true;
        });
    });
};

export default function SyndicatorInformation({ data }: SyndicatorInformationProps) {
    // Generate all possible sections with their configurations
    interface Section {
        title: string;
        config: any;
        priority: number;
        preferredSize: 'small' | 'medium' | 'large' | 'full';
    }
    
    const allSections = [
        {
            title: 'Basic Information',
            config: getBasicInformationConfig(data),
            priority: 1,
            preferredSize: 'large' as const
        },
        {
            title: 'Address Information',
            config: getAddressInformationConfig(data),
            priority: 2,
            preferredSize: 'large' as const
        },
        {
            title: 'Business Information',
            config: getBusinessInformationConfig(data),
            priority: 3,
            preferredSize: 'large' as const
        },
        {
            title: 'Statistics Overview',
            config: getStatisticsConfig(data),
            priority: 4,
            preferredSize: 'large' as const
        },
        {
            title: 'Syndication Offers',
            config: getSyndicationOffersConfig(data),
            priority: 5,
            preferredSize: 'large' as const
        },
        {
            title: 'Syndication Amounts',
            config: getSyndicationAmountsConfig(data),
            priority: 6,
            preferredSize: 'large' as const
        },
        {
            title: 'System Information',
            config: getSystemInformationConfig(data),
            priority: 9,
            preferredSize: 'large' as const
        },
        {
            title: 'Associated Funders',
            config: getAssociatedFundersConfig(data),
            priority: 7,
            preferredSize: 'full' as const
        }
    ] as Section[];

    // Filter out sections with no actual data
    const validSections = allSections.filter(section => hasValidData(section.config, data));

    // Sort by priority
    validSections.sort((a, b) => a.priority - b.priority);

    // Group sections by preferred size for optimal layout
    const mediumSections = validSections.filter(s => s.preferredSize === 'medium');
    const largeSections = validSections.filter(s => s.preferredSize === 'large');
    const fullSections = validSections.filter(s => s.preferredSize === 'full');

    // Create dynamic grid layout based on available sections
    const renderMediumSections = () => {
        if (mediumSections.length === 0) return null;

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {mediumSections.map((section) => (
                    <div
                        key={section.title}
                        className="bg-white rounded-lg shadow-sm border border-gray-200"
                    >
                        <div className="px-4 py-3 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                        </div>
                        <div className="p-3">
                            <Display
                                data={data}
                                config={section.config}
                                title=""
                                className="gap-y-2 gap-x-3"
                            />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderLargeSections = () => {
        if (largeSections.length === 0) return null;

        return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {largeSections.map((section) => (
                    <div
                        key={section.title}
                        className="bg-white rounded-lg shadow-sm border border-gray-200"
                    >
                        <div className="px-4 py-3 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                        </div>
                        <div className="p-4">
                            <Display
                                data={data}
                                config={section.config}
                                title=""
                                className="gap-y-2 gap-x-3"
                            />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderFullSections = () => {
        if (fullSections.length === 0) return null;

        return fullSections.map((section) => (
            <div
                key={section.title}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
            >

                {section.title === 'Associated Funders' ? null : (
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                    </div>
                )}
                <div className="p-4">
                    <Display
                        data={data}
                        config={section.config}
                        title=""
                    />
                </div>
            </div>
        ));
    };

    return (
        <div className="p-4 space-y-4">
            {renderMediumSections()}
            {renderLargeSections()}
            {renderFullSections()}

            {validSections.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                    No syndicator information available to display.
                </div>
            )}
        </div>
    );
} 