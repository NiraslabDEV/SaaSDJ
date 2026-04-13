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
  const nameEl = document.getElementById('profile-name');
  const bioEl = document.getElementById('profile-bio');
  const genresContainer = document.getElementById('profile-genres');
  const editBtn = document.querySelector('[onclick="editProfile()"]');

  // Se já está editando, salvar
  if (document.getElementById('edit-mode')) {
    saveProfile();
    return;
  }

  // Marcar modo edição
  const editFlag = document.createElement('input');
  editFlag.type = 'hidden';
  editFlag.id = 'edit-mode';
  document.body.appendChild(editFlag);

  // Trocar botão texto
  editBtn.querySelector('.text-on-surface').textContent = 'Salvar Perfil';
  editBtn.querySelector('.material-symbols-outlined').textContent = 'save';

  // Tornar nome editável
  const currentName = nameEl.textContent;
  nameEl.innerHTML = `<input id="edit-name" class="bg-surface-container-highest border-none rounded-lg px-4 py-2 text-on-surface text-center font-headline text-3xl font-bold tracking-tight uppercase w-full outline-none focus:ring-2 focus:ring-primary-container" value="${currentName}" />`;

  // Tornar bio editável
  const currentBio = bioEl.textContent;
  bioEl.innerHTML = `<textarea id="edit-bio" class="w-full bg-surface-container-highest border-none rounded-lg p-4 text-on-surface text-base outline-none focus:ring-2 focus:ring-primary-container resize-none" rows="4">${currentBio}</textarea>`;

  // Tornar gêneros editáveis
  const currentGenres = Array.from(genresContainer.querySelectorAll('span')).map(s => s.textContent);
  genresContainer.innerHTML = `
    <input id="edit-genres" class="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary-container" value="${currentGenres.join(', ')}" placeholder="Gêneros separados por vírgula" />
    <p class="text-xs text-on-surface-variant mt-1">Separe os gêneros por vírgula (ex: Deep House, Techno, Afro House)</p>
  `;
}

async function saveProfile() {
  const name = document.getElementById('edit-name').value.trim();
  const bio = document.getElementById('edit-bio').value.trim();
  const genresStr = document.getElementById('edit-genres').value;
  const genres = genresStr.split(',').map(g => g.trim()).filter(g => g.length > 0);

  if (!name) {
    alert('Nome é obrigatório');
    return;
  }

  try {
    const updated = await updateMe({ name, bio, genres });
    
    // Remover flag de edição
    const editFlag = document.getElementById('edit-mode');
    if (editFlag) editFlag.remove();

    // Repopular perfil
    populateProfile(updated);

    // Restaurar botão
    const editBtn = document.querySelector('[onclick="editProfile()"]');
    editBtn.querySelector('.text-on-surface').textContent = 'Editar Perfil';
    editBtn.querySelector('.material-symbols-outlined').textContent = 'person_edit';
  } catch (err) {
    alert('Erro ao salvar perfil: ' + (err.message || 'Tente novamente'));
  }
}
