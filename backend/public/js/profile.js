// Profile Script

redirectIfNotLoggedIn();

window.addEventListener('load', async () => {
  try {
    const userProfile = await getMe();
    populateProfile(userProfile);
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    alert('Erro ao carregar perfil');
  }
});

function populateProfile(user) {
  // Nome
  document.getElementById('profile-name').textContent = user.name || 'DJ';
  
  // Bio
  document.getElementById('profile-bio').textContent = user.bio || 'Profissional experiente em composição de atmosferas musicais.';
  
  // Foto
  if (user.profilePicture) {
    document.getElementById('profile-photo').src = user.profilePicture;
  }
  
  // Stats
  document.getElementById('profile-bookings').textContent = user.bookingsCount || '0';
  document.getElementById('profile-years').textContent = user.yearsActive || '0';
  
  // Gêneros
  const genresContainer = document.getElementById('profile-genres');
  genresContainer.innerHTML = '';
  if (user.genres && Array.isArray(user.genres)) {
    user.genres.forEach(genre => {
      const tag = document.createElement('span');
      tag.className = 'px-4 py-2 rounded-full bg-surface-container-high text-primary text-xs font-label font-semibold border border-outline-variant/20 uppercase tracking-wider';
      tag.textContent = genre;
      genresContainer.appendChild(tag);
    });
  }
}

function editProfile() {
  // Implementar edição em modal ou página separada
  alert('Edição de perfil disponível em breve');
}
