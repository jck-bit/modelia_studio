import { test, expect } from '@playwright/test';

test.describe('AI Studio App', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display the main UI elements', async ({ page }) => {
        // Check header
        await expect(page.getByRole('heading', { name: 'AI Image Generator' })).toBeVisible();
        await expect(page.getByText(/Try the ultimate Image Generator/)).toBeVisible();

        // Check breadcrumb navigation
        await expect(page.getByText('Home')).toBeVisible();
        await expect(page.getByText('AI Suite')).toBeVisible();

        // Check form elements
        await expect(page.getByPlaceholder('Describe what you want to see')).toBeVisible();
        await expect(page.getByLabel('Upload image file')).toBeVisible();
        await expect(page.getByRole('combobox')).toBeVisible();
        await expect(page.getByRole('button', { name: /Generate/i })).toBeVisible();

        // Check preview section
        await expect(page.getByText('Live Preview')).toBeVisible();
    });

    test('should handle complete generation workflow', async ({ page }) => {
        // Upload an image
        const fileInput = page.getByLabel('Upload image file');

        // Create a test image buffer (1x1 pixel PNG)
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'base64'
        );

        // Set the file input
        await fileInput.setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: testImageBuffer,
        });

        // Enter prompt
        await page.getByPlaceholder('Describe what you want to see').fill('A beautiful sunset over mountains');

        // Select style
        await page.getByRole('combobox').selectOption('Vintage');

        // Check live preview updates
        await expect(page.getByText('A beautiful sunset over mountains')).toBeVisible();
        await expect(page.getByText('Vintage')).toBeVisible();

        // Click generate
        await page.getByRole('button', { name: /Generate/i }).click();

        // Check loading state
        await expect(page.getByText('Generating')).toBeVisible();

        // Wait for generation to complete (mock API delay)
        await page.waitForTimeout(3000);

        // Check that history is updated
        await expect(page.getByText('Recent Generations')).toBeVisible();
        await expect(page.getByRole('button', { name: /Restore generation/i })).toBeVisible();
    });

    test('should validate image file type', async ({ page }) => {
        const fileInput = page.getByLabel('Upload image file');

        // Try to upload a non-image file
        await fileInput.setInputFiles({
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('test content'),
        });

        // Check for alert
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Please upload a valid image file');
            await dialog.accept();
        });
    });

    test('should disable generate button when inputs are missing', async ({ page }) => {
        const generateButton = page.getByRole('button', { name: /Generate/i });

        // Initially disabled
        await expect(generateButton).toBeDisabled();

        // Upload image only - still disabled
        await page.getByLabel('Upload image file').setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from('fake image data'),
        });
        await expect(generateButton).toBeDisabled();

        // Add prompt - should be enabled now
        await page.getByPlaceholder('Describe what you want to see').fill('Test prompt');
        await expect(generateButton).toBeEnabled();
    });

    test('should handle keyboard navigation', async ({ page }) => {
        // Tab through elements
        await page.keyboard.press('Tab'); // Focus on prompt input
        await expect(page.getByPlaceholder('Describe what you want to see')).toBeFocused();

        await page.keyboard.press('Tab'); // Focus on style dropdown
        await expect(page.getByRole('combobox')).toBeFocused();

        await page.keyboard.press('Tab'); // Focus on generate button
        await expect(page.getByRole('button', { name: /Generate/i })).toBeFocused();

        await page.keyboard.press('Tab'); // Focus on file input
        await expect(page.getByLabel('Upload image file')).toBeFocused();
    });

    test('should restore from history', async ({ page }) => {
        // First, create a generation
        await page.getByLabel('Upload image file').setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
        });

        await page.getByPlaceholder('Describe what you want to see').fill('First generation');
        await page.getByRole('combobox').selectOption('Minimalist');
        await page.getByRole('button', { name: /Generate/i }).click();

        // Wait for generation
        await page.waitForTimeout(3000);

        // Clear inputs
        await page.getByPlaceholder('Describe what you want to see').fill('');
        await page.getByRole('combobox').selectOption('Editorial');

        // Click on history item
        const historyButton = page.getByRole('button', { name: /Restore generation: First generation/i });
        await historyButton.click();

        // Check that values are restored
        await expect(page.getByPlaceholder('Describe what you want to see')).toHaveValue('First generation');
        await expect(page.getByRole('combobox')).toHaveValue('Minimalist');
    });

    test('should show error message on generation failure', async ({ page, context }) => {
        // Intercept API calls to simulate error
        await context.route('**/api/**', route => {
            route.fulfill({ status: 500, body: 'Error' });
        });

        // Set up for generation
        await page.getByLabel('Upload image file').setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from('fake image'),
        });
        await page.getByPlaceholder('Describe what you want to see').fill('Test');

        // Try to generate
        await page.getByRole('button', { name: /Generate/i }).click();

        // Should show retry attempts
        await expect(page.getByText(/Retry/)).toBeVisible();
    });

    test('should persist history across page reloads', async ({ page }) => {
        // Create a generation
        await page.getByLabel('Upload image file').setInputFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
        });
        await page.getByPlaceholder('Describe what you want to see').fill('Persistent generation');
        await page.getByRole('button', { name: /Generate/i }).click();

        // Wait for generation
        await page.waitForTimeout(3000);

        // Reload page
        await page.reload();

        // Check that history is still there
        await expect(page.getByText('Recent Generations')).toBeVisible();
        await expect(page.getByRole('button', { name: /Restore generation: Persistent generation/i })).toBeVisible();
    });

    test('should be accessible with screen reader', async ({ page }) => {
        // Check ARIA labels
        const promptInput = page.getByPlaceholder('Describe what you want to see');
        await expect(promptInput).toHaveAttribute('aria-label', 'Generation prompt');

        const styleSelect = page.getByRole('combobox');
        await expect(styleSelect).toHaveAttribute('aria-label', 'Style selection');

        const generateButton = page.getByRole('button', { name: /Generate/i });
        await expect(generateButton).toHaveAttribute('aria-label', 'Generate image');

        const fileInput = page.getByLabel('Upload image file');
        await expect(fileInput).toHaveAttribute('aria-label', 'Upload image file');
    });
});
