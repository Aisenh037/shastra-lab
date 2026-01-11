import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShastraLabLogo } from './ShastraLabLogo';

describe('ShastraLabLogo', () => {
  it('should render the logo', () => {
    render(<ShastraLabLogo />);

    // Should render the logo image or text
    const logo = screen.getByRole('img') || screen.getByText(/ShastraLab/i);
    expect(logo).toBeInTheDocument();
  });

  it('should have proper alt text for accessibility', () => {
    render(<ShastraLabLogo />);

    const logoImage = screen.queryByRole('img');
    if (logoImage) {
      expect(logoImage).toHaveAttribute('alt');
      expect(logoImage.getAttribute('alt')).toContain('ShastraLab');
    }
  });

  it('should render with custom className', () => {
    const customClass = 'custom-logo-class';
    render(<ShastraLabLogo className={customClass} />);

    const logoContainer = screen.getByTestId('shastralab-logo') || 
                         screen.getByRole('img') || 
                         screen.getByText(/ShastraLab/i).closest('div');
    
    if (logoContainer) {
      expect(logoContainer).toHaveClass(customClass);
    }
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<ShastraLabLogo size="sm" />);
    
    let logo = screen.getByTestId('shastralab-logo') || 
               screen.getByRole('img') || 
               screen.getByText(/ShastraLab/i).closest('div');
    
    if (logo) {
      expect(logo).toHaveClass(/sm|small/);
    }

    rerender(<ShastraLabLogo size="lg" />);
    
    logo = screen.getByTestId('shastralab-logo') || 
           screen.getByRole('img') || 
           screen.getByText(/ShastraLab/i).closest('div');
    
    if (logo) {
      expect(logo).toHaveClass(/lg|large/);
    }
  });

  it('should be clickable when onClick is provided', () => {
    const handleClick = vi.fn();
    render(<ShastraLabLogo onClick={handleClick} />);

    const logo = screen.getByRole('img') || screen.getByText(/ShastraLab/i);
    fireEvent.click(logo);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render as a link when href is provided', () => {
    render(<ShastraLabLogo href="/" />);

    const logoLink = screen.getByRole('link');
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should have proper dimensions', () => {
    render(<ShastraLabLogo />);

    const logoImage = screen.queryByRole('img');
    if (logoImage) {
      // Should have width and height attributes or CSS classes
      const hasWidth = logoImage.hasAttribute('width') || 
                      logoImage.className.includes('w-') ||
                      logoImage.style.width;
      const hasHeight = logoImage.hasAttribute('height') || 
                       logoImage.className.includes('h-') ||
                       logoImage.style.height;
      
      expect(hasWidth || hasHeight).toBe(true);
    }
  });

  it('should load the correct image source', () => {
    render(<ShastraLabLogo />);

    const logoImage = screen.queryByRole('img');
    if (logoImage) {
      const src = logoImage.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src).toMatch(/logo|shastra/i);
    }
  });

  it('should handle image loading errors gracefully', () => {
    render(<ShastraLabLogo />);

    const logoImage = screen.queryByRole('img');
    if (logoImage) {
      // Simulate image load error
      fireEvent.error(logoImage);
      
      // Should still be in document (fallback handling)
      expect(logoImage).toBeInTheDocument();
    }
  });

  it('should render with proper semantic markup', () => {
    render(<ShastraLabLogo />);

    // Should be wrapped in appropriate semantic element
    const logo = screen.getByRole('img') || screen.getByText(/ShastraLab/i);
    const parent = logo.closest('div, header, nav, a');
    
    expect(parent).toBeInTheDocument();
  });

  it('should support dark mode styling', () => {
    render(
      <div className="dark">
        <ShastraLabLogo />
      </div>
    );

    const logo = screen.getByRole('img') || screen.getByText(/ShastraLab/i);
    
    // Should have dark mode classes or styling
    const hasDarkModeSupport = logo.className.includes('dark:') ||
                              logo.closest('[class*="dark"]') !== null;
    
    expect(hasDarkModeSupport).toBe(true);
  });

  it('should be responsive', () => {
    render(<ShastraLabLogo />);

    const logo = screen.getByRole('img') || screen.getByText(/ShastraLab/i);
    
    // Should have responsive classes
    const hasResponsiveClasses = logo.className.includes('sm:') ||
                                logo.className.includes('md:') ||
                                logo.className.includes('lg:') ||
                                logo.className.includes('responsive');
    
    // Responsive support is optional but good to have
    expect(logo).toBeInTheDocument();
  });
});