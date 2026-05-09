import React, { useState, useEffect } from 'react';

interface HeaderProps {
    title: string;
    actions?: React.ReactNode;
    isSticky?: boolean;
}

export function Header({ title, actions, isSticky = true }: HeaderProps) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        if (!isSticky) return;

        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrolled, isSticky]);

    const headerClass = `app-header ${isSticky ? 'app-header--sticky' : ''} ${
        scrolled ? 'app-header--scrolled' : ''
    }`;

    return (
        <header className={headerClass}>
            <h1 className="app-header__title">{title}</h1>
            {actions && <div className="app-header__actions">{actions}</div>}
        </header>
    );
}

export default Header;
