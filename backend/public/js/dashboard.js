// Dashboard Script - Carrega dados e popula interface

redirectIfNotLoggedIn();

const user = getUser();
const statusColors = {
  APPROVED: 'bg-primary/10 text-primary',
  PENDING: 'bg-white/5 text-white/50',
  REJECTED: 'bg-error/10 text-error',
  COUNTER_PROPOSAL: 'bg-secondary-dim/10 text-secondary'
};

const statusLabels = {
  APPROVED: 'Aprovado',
  PENDING: 'Pendente',
  REJECTED: 'Rejeitado',
  COUNTER_PROPOSAL: 'Contraproposta'
};

// Carregar dados ao abrir a página
window.addEventListener('load', async () => {
  await loadDashboardData();
});

// Preenchercomunidades
document.getElementById('user-name').textContent = user?.name || 'Usuário';

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  logout();
  window.location.href = '/login.html';
});

async function loadDashboardData() {
  try {
    // Carregar dados em paralelo
    const [earningsData, bookingsData] = await Promise.all([
      getEarnings().catch(() => ({ total: 0, growth: 0 })),
      listBookings().catch(() => [])
    ]);

    // Preencher earnings
    document.getElementById('earnings-amount').textContent = `R$ ${earningsData.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`;
    document.getElementById('earnings-growth').textContent = `${earningsData.growth >= 0 ? '+' : ''}${earningsData.growth}%`;

    // Renderizar bookings
    const bookingsList = document.getElementById('bookings-list');
    if (bookingsData && bookingsData.length > 0) {
      bookingsList.innerHTML = bookingsData
        .slice(0, 5) // Mostrar apenas os 5 mais recentes
        .map(booking => renderBookingRow(booking))
        .join('');
    } else {
      bookingsList.innerHTML = '<div class="text-center py-8 text-on-surface-variant">Nenhum booking recente</div>';
    }
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

function renderBookingRow(booking) {
  const statusClass = statusColors[booking.status] || 'bg-white/5 text-white/50';
  const statusLabel = statusLabels[booking.status] || booking.status;
  const date = new Date(booking.dateTime).toLocaleDateString('pt-BR');
  const location = booking.location || 'Local não especificado';
  const eventName = booking.eventName || 'Evento';

  return `
    <div class="bg-surface-container-low hover:bg-surface-container-high transition-colors p-5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer" onclick="window.location.href='/booking-details.html?bookingId=${booking.id}'">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-surface-container-highest rounded-xl flex items-center justify-center">
          <span class="material-symbols-outlined text-primary">event</span>
        </div>
        <div>
          <div class="font-bold">${eventName}</div>
          <div class="text-xs text-on-surface-variant">${date} • ${location}</div>
        </div>
      </div>
      <div class="hidden md:block">
        <div class="text-sm font-medium">Cachet</div>
        <div class="text-xs text-on-surface-variant">R$ ${booking.basePrice?.toLocaleString('pt-BR') || '0'}</div>
      </div>
      <div class="px-4 py-1.5 rounded-full ${statusClass} text-xs font-bold uppercase tracking-wider">
        ${statusLabel}
      </div>
    </div>
  `;
}

// Notificações
document.getElementById('notifications-btn').addEventListener('click', async () => {
  try {
    const notifications = await getNotifications();
    console.log('Notificações:', notifications);
    // Pode abrir modal ou redirecionar para página de notificações
  } catch (err) {
    console.error('Erro ao carregar notificações:', err);
  }
});
