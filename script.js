/* ==========================================
   Early Cashout Calculator - JavaScript Logic
   ========================================== */

(function () {
    'use strict';

    // ======= DOM References =======
    const originalStakeInput = document.getElementById('original-stake');
    const originalOddsInput = document.getElementById('original-odds');
    const newOddsInput = document.getElementById('new-odds');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsPanel = document.getElementById('results-panel');
    const formatBtns = document.querySelectorAll('.toggle-btn[data-format]');
    const originalOddsHint = document.getElementById('original-odds-hint');
    const newOddsHint = document.getElementById('new-odds-hint');

    // Result fields
    const cashoutValueEl = document.getElementById('cashout-value');
    const cashoutProfitEl = document.getElementById('cashout-profit');
    const originalPayoutEl = document.getElementById('original-payout');
    const returnPercentageEl = document.getElementById('return-percentage');

    // Breakdown fields
    const bdOriginalStake = document.getElementById('bd-original-stake');
    const bdOriginalOdds = document.getElementById('bd-original-odds');
    const bdNewOdds = document.getElementById('bd-new-odds');
    const bdFormula = document.getElementById('bd-formula');
    const bdCashoutValue = document.getElementById('bd-cashout-value');
    const bdProfit = document.getElementById('bd-profit');

    let currentFormat = 'decimal';

    // ======= Odds Format Hints =======
    const hintText = {
        decimal: 'Enter decimal odds (e.g. 3.00)',
        fractional: 'Enter fractional odds (e.g. 3/2)',
        american: 'Enter American odds (e.g. +200 or -150)',
    };

    // ======= Format Switching =======
    formatBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            formatBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            currentFormat = btn.dataset.format;

            originalOddsHint.textContent = hintText[currentFormat];
            newOddsHint.textContent = 'Enter current ' + hintText[currentFormat].replace('Enter ', '');

            const placeholders = {
                decimal: '2.50',
                fractional: '3/2',
                american: '+150',
            };
            originalOddsInput.placeholder = 'e.g. ' + placeholders[currentFormat];
            newOddsInput.placeholder = 'e.g. ' + (currentFormat === 'decimal' ? '1.50' : currentFormat === 'fractional' ? '1/2' : '-150');

            originalOddsInput.value = '';
            newOddsInput.value = '';
            resultsPanel.style.display = 'none';
            clearErrors();
        });
    });

    // ======= Odds Conversion =======

    function fractionalToDecimal(str) {
        const parts = str.trim().split('/');
        if (parts.length !== 2) return NaN;
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        if (isNaN(num) || isNaN(den) || den === 0) return NaN;
        return num / den + 1;
    }

    function americanToDecimal(str) {
        const value = parseFloat(str.trim());
        if (isNaN(value) || value === 0) return NaN;
        if (value > 0) {
            return value / 100 + 1;
        } else {
            return 100 / Math.abs(value) + 1;
        }
    }

    function toDecimalOdds(str, format) {
        str = str.trim();
        if (!str) return NaN;
        switch (format) {
            case 'decimal': return parseFloat(str);
            case 'fractional': return fractionalToDecimal(str);
            case 'american': return americanToDecimal(str);
            default: return parseFloat(str);
        }
    }

    // ======= Validation =======
    function showError(input, message) {
        const wrapper = input.closest('.input-wrapper');
        wrapper.classList.add('error');
        const existing = wrapper.parentElement.querySelector('.error-message');
        if (existing) existing.remove();
        const errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        wrapper.parentElement.appendChild(errorEl);
    }

    function clearErrors() {
        document.querySelectorAll('.input-wrapper.error').forEach((el) => el.classList.remove('error'));
        document.querySelectorAll('.error-message').forEach((el) => el.remove());
    }

    function validate() {
        clearErrors();
        let valid = true;

        const stake = parseFloat(originalStakeInput.value);
        if (isNaN(stake) || stake <= 0) {
            showError(originalStakeInput, 'Please enter a valid stake greater than 0');
            valid = false;
        }

        const origOdds = toDecimalOdds(originalOddsInput.value, currentFormat);
        if (isNaN(origOdds) || origOdds <= 1) {
            showError(originalOddsInput, 'Please enter valid odds (decimal must be > 1.00)');
            valid = false;
        }

        const nOdds = toDecimalOdds(newOddsInput.value, currentFormat);
        if (isNaN(nOdds) || nOdds <= 1) {
            showError(newOddsInput, 'Please enter valid odds (decimal must be > 1.00)');
            valid = false;
        }

        return valid;
    }

    // ======= Calculation =======
    function calculate() {
        if (!validate()) return;

        const stake = parseFloat(originalStakeInput.value);
        const origOdds = toDecimalOdds(originalOddsInput.value, currentFormat);
        const nOdds = toDecimalOdds(newOddsInput.value, currentFormat);

        // Core formula: Cashout Value = (Original Stake × Original Odds) / New Odds
        const cashoutValue = (stake * origOdds) / nOdds;

        // Profit = Cashout Value - Original Stake
        const profit = cashoutValue - stake;

        // Original potential payout (if bet won without cashing out)
        const originalPayout = stake * origOdds;

        // Return on stake percentage
        const returnPct = (profit / stake) * 100;

        // Display primary results
        cashoutValueEl.textContent = formatCurrency(cashoutValue);
        cashoutProfitEl.textContent = formatCurrency(profit);
        originalPayoutEl.textContent = formatCurrency(originalPayout);
        returnPercentageEl.textContent = (returnPct >= 0 ? '+' : '') + returnPct.toFixed(1) + '%';

        // Color code profit
        cashoutProfitEl.style.color = profit >= 0 ? 'var(--success)' : 'var(--danger)';
        returnPercentageEl.style.color = returnPct >= 0 ? 'var(--success)' : 'var(--danger)';

        // Breakdown
        bdOriginalStake.textContent = formatCurrency(stake);
        bdOriginalOdds.textContent = origOdds.toFixed(2);
        bdNewOdds.textContent = nOdds.toFixed(2);
        bdFormula.textContent = `(${formatCurrency(stake)} × ${origOdds.toFixed(2)}) ÷ ${nOdds.toFixed(2)}`;
        bdCashoutValue.textContent = formatCurrency(cashoutValue);
        bdProfit.textContent = formatCurrency(profit);

        // Show results
        resultsPanel.style.display = 'block';
        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Button feedback
        calculateBtn.querySelector('.btn-text').textContent = '✓ Calculated!';
        setTimeout(() => {
            calculateBtn.querySelector('.btn-text').textContent = 'Calculate Cashout';
        }, 2000);
    }

    // ======= Helpers =======
    function formatCurrency(amount) {
        const prefix = amount < 0 ? '-$' : '$';
        return prefix + Math.abs(amount).toFixed(2);
    }

    // ======= Event Listeners =======
    calculateBtn.addEventListener('click', calculate);

    [originalStakeInput, originalOddsInput, newOddsInput].forEach((input) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                calculate();
            }
        });
        input.addEventListener('input', () => {
            const wrapper = input.closest('.input-wrapper');
            wrapper.classList.remove('error');
            const errorMsg = wrapper.parentElement.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        });
    });

    // ======= Smooth scroll for anchor links =======
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ======= Header scroll effect (throttled) =======
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const header = document.getElementById('site-header');
                if (window.scrollY > 100) {
                    header.style.background = 'rgba(10, 14, 26, 0.95)';
                    header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
                } else {
                    header.style.background = 'rgba(10, 14, 26, 0.85)';
                    header.style.boxShadow = 'none';
                }
                ticking = false;
            });
            ticking = true;
        }
    });
})();
