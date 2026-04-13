// Booking Details Script

redirectIfNotLoggedIn();

let currentBooking = null;
const user = getUser();

window.addEventListener('load', async () => {
  const params = new URLSearchParams(location.search);
  const bookingId = params.get('bookingId');

  if (!bookingId) {
    alert('ID do booking não especificado');
    window.location.href = '/dashboard.html';
    return;
  }

  try {
    currentBooking = await getBooking(bookingId);
    populateBookingData(currentBooking);
    setupFormVisibility(currentBooking);
  } catch (err) {
    console.error('Erro ao carregar booking:', err);
    alert('Erro ao carregar booking');
    window.location.href = '/dashboard.html';
  }
});

function populateBookingData(booking) {
  // Título do evento
  document.getElementById('event-title').textContent = booking.eventName || 'Evento';

  // Status
  const statusMap = {
    'APPROVED': { label: 'Aprovado', class: 'bg-primary/10 text-primary' },
    'PENDING': { label: 'Pendente', class: 'bg-white/5 text-white/50' },
    'REJECTED': { label: 'Rejeitado', class: 'bg-error/10 text-error' },
    'COUNTER_PROPOSAL': { label: 'Contraproposta', class: 'bg-secondary-dim/10 text-secondary' }
  };

  const status = statusMap[booking.status] || { label: booking.status, class: 'bg-white/5 text-white/50' };
  const statusEl = document.getElementById('booking-status');
  statusEl.textContent = status.label;
  statusEl.className = `inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${status.class}`;

  // Data
  const date = new Date(booking.dateTime);
  document.getElementById('summary-date').textContent = date.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Local
  document.getElementById('summary-location').textContent = booking.location || 'Local não especificado';

  // Status
  document.getElementById('summary-status').textContent = status.label;

  // Preço
  const price = booking.basePrice || 0;
  document.getElementById('summary-price').textContent = price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  document.getElementById('total-price').textContent = price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // Auto-fill contraproposta com valores atuais
  document.getElementById('counter-amount').value = booking.basePrice || '';
  document.getElementById('counter-hours').value = booking.duration || '';
}

function setupFormVisibility(booking) {
  // Mostrar formulário de contraproposta apenas se:
  // - User é artista (role === ARTIST)
  // - Status é PENDING ou COUNTER_PROPOSAL
  const isArtist = user && user.role === 'ARTIST';
  const canCounterProposal = booking.status === 'PENDING' || booking.status === 'COUNTER_PROPOSAL';

  if (isArtist && canCounterProposal) {
    document.getElementById('counter-form').classList.remove('hidden');
  }

  // Mostrar botão de rejeição se é artista e está pendente
  if (isArtist && booking.status === 'PENDING') {
    document.getElementById('btn-reject').style.display = 'block';
  } else {
    document.getElementById('btn-reject').style.display = 'none';
  }

  // Botão de contrato só aparece se aprovado
  if (booking.status === 'APPROVED') {
    document.getElementById('btn-contract').style.display = 'block';
  } else {
    document.getElementById('btn-contract').style.display = 'none';
  }
}

async function submitCounterProposal() {
  const amount = parseFloat(document.getElementById('counter-amount').value);
  const hours = parseInt(document.getElementById('counter-hours').value);
  const notes = document.getElementById('counter-notes').value;

  if (isNaN(amount) || isNaN(hours)) {
    alert('Preencha todos os campos');
    return;
  }

  try {
    const result = await sendCounterProposal(currentBooking.id, {
      proposedAmount: amount,
      proposedDuration: hours,
      notes
    });

    alert('Contraproposta enviada com sucesso!');
    window.location.href = '/dashboard.html';
  } catch (err) {
    alert('Erro ao enviar contraproposta: ' + (err.message || 'Tente novamente'));
  }
}

async function rejectBooking() {
  if (!confirm('Tem certeza que deseja rejeitar este booking?')) {
    return;
  }

  try {
    await updateBookingStatus(currentBooking.id, 'REJECTED');
    alert('Booking rejeitado.');
    window.location.href = '/dashboard.html';
  } catch (err) {
    alert('Erro ao rejeitar booking: ' + (err.message || 'Tente novamente'));
  }
}

async function generateContractPDF() {
  try {
    const result = await generateContract(currentBooking.id);
    // Abrir em nova aba
    if (result.pdfUrl) {
      window.open(result.pdfUrl, '_blank');
    } else {
      alert('Erro ao gerar contrato');
    }
  } catch (err) {
    alert('Erro ao gerar contrato: ' + (err.message || 'Tente novamente'));
  }
}

