'use client';

import { useState, useRef } from 'react';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface LoginFormProps {
    onSubmit: (email: string, password: string) => Promise<void>;
    loading?: boolean;
    error?: string;
}

export default function LoginForm({ onSubmit, loading = false, error = '' }: LoginFormProps) {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [failed, setFailed] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFailed(false);
        try {
            await onSubmit(formData.email, formData.password);
        } catch {
            setFailed(true);
        }
    };

    const handleInputChange = (field: 'email' | 'password', value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (failed) {
            setFailed(false);
        }
    };

    return (
        <div className="w-full max-w-[550px] h-130 bg-gray-100 rounded-2xl p-12 flex flex-col items-center justify-center relative shadow-[inset_0px_4px_4px_rgba(0,0,0,0.25)] box-border">
            <h1 className="text-3xl font-bold text-center text-gray-800">
                Welcome back!
            </h1>
            <p className="text-center text-gray-600 mb-8">Log in to your funder account</p>

            <form
                method="post"
                onSubmit={handleSubmit}
                className="space-y-6 w-full max-w-sm"
                autoComplete="on"
            >
                {error && (
                    <div className="text-red-500 text-sm text-center bg-red-100 p-2 rounded">
                        {error}
                    </div>
                )}
                <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 cursor-pointer" onClick={() => emailRef.current?.focus()} />
                    <input
                        ref={emailRef}
                        type="email"
                        name="email"
                        id="email"
                        required
                        autoComplete="email"
                        placeholder="Email"
                        className={`text-black w-full h-12 pl-12 pr-4 py-3 rounded-lg border bg-gray-50 placeholder-gray-500 text-custom-black ${failed || error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                </div>

                <div>
                    <div className="relative">
                        <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 cursor-pointer" onClick={() => passwordRef.current?.focus()} />
                        <input
                            ref={passwordRef}
                            type={showPassword ? "text" : "password"}
                            name="password"
                            id="password"
                            required
                            autoComplete="current-password"
                            placeholder="Password"
                            className={`text-black w-full h-12 pl-12 pr-10 py-3 rounded-lg border  bg-gray-50  placeholder-gray-500 text-custom-black ${failed || error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                            onClick={() => {
                                setShowPassword(!showPassword);
                            }}
                        >
                            {showPassword ? (<EyeIcon className="text-gray-700 w-5 h-5" />) : (<EyeSlashIcon className="text-gray-400 w-5 h-5" />)}
                        </button>
                    </div>

                    <div className="flex items-center justify-end mt-2">
                        <a href="#" className="text-sm text-blue-700 hover:underline">
                            Forgot Password?
                        </a>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`block w-full bg-[#265A88] text-white py-3 rounded-lg hover:bg-[#1e406b] transition-colors duration-200 text-center m-auto cursor-pointer ${
                        loading ? 'opacity-80' : ''
                    } disabled:bg-[#265A88] disabled:text-white disabled:cursor-not-allowed`}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            {/* Bottom links section */}
            <div className="pt-2 border-t border-gray-200 text-center text-sm">
                <p className="text-gray-600 mb-2">
                    Don&apos;t have an account?{' '}
                    <a href="#" className="text-blue-700 hover:underline font-medium">
                        Register here
                    </a>
                </p>
                
                <div className="flex items-center justify-center mb-2">
                    <div className="border-t border-gray-300 flex-1 max-w-16"></div>
                    <span className="text-xs text-gray-400 px-3">OR</span>
                    <div className="border-t border-gray-300 flex-1 max-w-16"></div>
                </div>
                
                <p>
                    <a href="/import" className="text-blue-700 hover:underline font-medium inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Import from other platforms
                    </a>
                </p>
            </div>
        </div>
    );
}
