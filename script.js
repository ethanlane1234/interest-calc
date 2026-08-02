const form = document.getElementById('calculator-form');
const principalInput = document.getElementById('principal');
const yearsInput = document.getElementById('years');
const ratesInput = document.getElementById('rates');
const summary = document.getElementById('summary');
const chart = document.getElementById('chart');

const palette = ['#4cc9f0', '#f72585', '#2ec4b6', '#ffb703', '#a78bfa'];

function parseRates(raw) {
  return raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function calculateSeries(principal, years, rate) {
  const series = [];
  let balance = principal;

  for (let year = 0; year <= years; year += 1) {
    series.push({
      year,
      balance: year === 0 ? principal : balance * (1 + rate / 100),
    });

    if (year > 0) {
      balance = balance * (1 + rate / 100);
    }
  }

  return series;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function renderSummary(seriesList) {
  summary.innerHTML = '';

  seriesList.forEach((series, index) => {
    const card = document.createElement('article');
    card.className = 'summary-card';

    const finalValue = series[series.length - 1].balance;
    const growth = ((finalValue / Number(principalInput.value)) - 1) * 100;

    card.innerHTML = `
      <h3>Rate ${series.rate}%</h3>
      <div class="value">${formatCurrency(finalValue)}</div>
      <p>${growth.toFixed(1)}% growth</p>
    `;

    card.style.borderColor = palette[index % palette.length];
    summary.appendChild(card);
  });
}

function renderChart(seriesList) {
  const width = 600;
  const height = 320;
  const padding = { top: 24, right: 20, bottom: 40, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxBalance = Math.max(...seriesList.flatMap((series) => series.map((point) => point.balance)));
  const minBalance = Math.min(...seriesList.flatMap((series) => series.map((point) => point.balance)));
  const maxY = maxBalance * 1.1;
  const minY = minBalance > 0 ? 0 : minBalance * 1.1;

  const xStep = seriesList[0].length > 1 ? plotWidth / (seriesList[0].length - 1) : plotWidth;
  const yScale = (value) => padding.top + plotHeight - ((value - minY) / (maxY - minY || 1)) * plotHeight;
  const xScale = (index) => padding.left + index * xStep;

  const lines = [];
  const dots = [];
  const labels = [];

  seriesList.forEach((series, index) => {
    const color = palette[index % palette.length];
    const pathPoints = series.map((point, pointIndex) => `${xScale(pointIndex)},${yScale(point.balance)}`).join(' ');
    lines.push(`<polyline class="line" points="${pathPoints}" stroke="${color}" />`);

    series.forEach((point, pointIndex) => {
      const x = xScale(pointIndex);
      const y = yScale(point.balance);
      dots.push(`<circle class="dot" cx="${x}" cy="${y}" r="4" fill="${color}" />`);
      labels.push(`<text class="value-label" x="${x}" y="${y - 8}" text-anchor="middle">${formatCurrency(point.balance)}</text>`);
    });
  });

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padding.top + (plotHeight / 4) * i;
    const value = maxY - ((maxY - minY) / 4) * i;
    return `<g><line class="grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" /><text class="axis-label" x="${padding.left - 10}" y="${y + 4}" text-anchor="end">${formatCurrency(value)}</text></g>`;
  }).join('');

  const xLabels = Array.from({ length: Number(yearsInput.value) + 1 }, (_, i) => {
    const x = xScale(i);
    return `<text class="axis-label" x="${x}" y="${height - 12}" text-anchor="middle">${i}</text>`;
  }).join('');

  chart.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" rx="18" fill="transparent"></rect>
    ${gridLines}
    <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="rgba(255,255,255,0.25)" />
    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(255,255,255,0.25)" />
    ${lines.join('')}
    ${dots.join('')}
    ${labels.join('')}
    ${xLabels}
    <text class="axis-label" x="${width / 2}" y="${height - 2}" text-anchor="middle">Years</text>
  `;
}

function calculateAndRender() {
  const principal = Number(principalInput.value);
  const years = Number(yearsInput.value);
  const rates = parseRates(ratesInput.value);

  const seriesList = rates.map((rate) => {
    const series = calculateSeries(principal, years, rate);
    return Object.assign(series, { rate });
  });

  renderSummary(seriesList);
  renderChart(seriesList);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  calculateAndRender();
});

calculateAndRender();
