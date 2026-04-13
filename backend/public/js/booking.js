// Booking Page Script

let currentDate = new Date();
let selectedDate = null;
let artistData = null;

// Base prices
const BASE_FEE = 1200;
const HOURLY_RATE = 300;
const LOGISTICS_FEE = 150;

// Inicialização
window.addEventListener('load', async () => {
  // Pegar artistId da URL
  const params = new URLSearchParams(location.search);
  const artistId = params.get('artistId');
  
  if (!artistId) {
    alert('ID do artista não especificado');
    window.location.href = '/index.html';
    return;
  }

  document.getElementById('artist-id').value = artistId;

  // Carregar dados do artista
  try {
    artistData = await getArtist(artistId);
    populateArtistInfo(artistData);
  } catch (err) {
    console.error('Erro ao carregar artista:', err);
    alert('Erro ao carregar dados do artista');
    window.location.href = '/index.html';
  }

  // Gerar calendário inicial
  generateCalendar();
  recalculatePrice();
});

function generateCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  let html = `
    <div class="text-center mb-4">
      <h4 class="font-headline font-semibold text-lg">${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h4>
    </div>
    <div class="grid grid-cols-7 gap-2 text-center mb-4">
      <div class="text-xs text-on-surface-variant font-medium">DOM</div>
      <div class="text-xs text-on-surface-variant font-medium">SEG</div>
      <div class="text-xs text-on-surface-variant font-medium">TER</div>
      <div class="text-xs text-on-surface-variant font-medium">QUA</div>
      <div class="text-xs text-on-surface-variant font-medium">QUI</div>
      <div class="text-xs text-on-surface-variant font-medium">SEX</div>
      <div class="text-xs text-on-surface-variant font-medium">SÁB</div>
    </div>
    <div class="grid grid-cols-7 gap-2">
  `;

  // Dias do mês anterior
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = new Date(year, month, -i).getDate();
    html += `<div class="h-12 flex items-center justify-center text-on-surface-variant opacity-30">${day}</div>`;
  }

  // Dias do mês atual
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    
    const classes = isSelected 
      ? 'bg-primary text-on-primary font-bold' 
      : isToday 
      ? 'border border-primary'
      : 'hover:bg-surface-container-high';
    
    html += `
      <div class="h-12 flex items-center justify-center rounded-lg cursor-pointer transition-all ${classes}" onclick="selectDate(new Date(${year}, ${month}, ${i}))">
        ${i}
      </div>
    `;
  }

  // Dias do próximo mês
  const remainingDays = 42 - (startingDayOfWeek + daysInMonth);
  for (let i = 1; i <= remainingDays; i++) {
    html += `<div class="h-12 flex items-center justify-center text-on-surface-variant opacity-30">${i}</div>`;
  }

  html += '</div>';
  document.getElementById('calendar-grid').innerHTML = html;
}

function selectDate(date) {
  selectedDate = date;
  document.getElementById('selected-date').value = date.toISOString().split('T')[0];
  generateCalendar();
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  generateCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  generateCalendar();
}

function recalculatePrice() {
  const duration = parseInt(document.getElementById('duration-select').value);
  const hoursTotal = BASE_FEE + (duration * HOURLY_RATE) + LOGISTICS_FEE;

  document.getElementById('set-hours-fee').textContent = `R$ ${(duration * HOURLY_RATE).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('logistics-fee').textContent = `R$ ${LOGISTICS_FEE.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('total-amount').textContent = `R$ ${hoursTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function populateArtistInfo(artist) {
  document.getElementById('artist-name').textContent = artist.name;
  document.getElementById('artist-genres').textContent = artist.genres?.join(' & ') || 'DJ';
  document.getElementById('artist-photo').src = artist.profilePicture || 'https://via.placeholder.com/64';
}

async function submitBooking() {
  if (!selectedDate) {
    alert('Selecione uma data');
    return;
  }

  const location = document.getElementById('location-input').value;
  const duration = parseInt(document.getElementById('duration-select').value);
  const time = document.getElementById('time-input').value;
  const artistId = document.getElementById('artist-id').value;

  if (!location) {
    alert('Informe o local');
    return;
  }

  try {
    const bookingData = {
      artistId,
      locationAddress: location,
      eventDate: `${selectedDate.toISOString().split('T')[0]}T${time}:00Z`,
      durationHours: duration
    };

    const booking = await createBooking(bookingData);
    alert('Proposta enviada com sucesso!');
    window.location.href = '/dashboard.html';
  } catch (err) {
    alert('Erro ao enviar proposta: ' + (err.message || 'Tente novamente'));
  }
}
