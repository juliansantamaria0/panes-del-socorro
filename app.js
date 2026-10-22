const WHATSAPP = '573155483640';
const enlaceWa = (texto) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Enlaces con mensaje ya escrito
document.querySelectorAll('[data-producto]').forEach((a) => {
  a.href = enlaceWa(`Hola, quisiera pedir ${a.dataset.producto}. ¿Tienen disponible hoy?`);
});
document.querySelectorAll('[data-mensaje]').forEach((a) => { a.href = enlaceWa(a.dataset.mensaje); });

// Abierto / cerrado según la hora de Colombia (UTC-5): todos los días de 6:00 a 20:00
const actualizarEstado = () => {
  const ahora = new Date();
  const hora = ((ahora.getUTCHours() + 19) % 24) + ahora.getUTCMinutes() / 60;
  const abierto = hora >= 6 && hora < 20;
  document.querySelectorAll('[data-estado]').forEach((el) => {
    el.classList.toggle('abierto', abierto);
    el.querySelector('[data-estado-texto]').textContent = abierto
      ? (el.classList.contains('estado-local') ? 'Abierto ahora · hasta las 8:00 p. m.' : 'Abierto ahora')
      : 'Cerrado ahora · abrimos a las 6:00 a. m.';
  });
};
actualizarEstado();
setInterval(actualizarEstado, 60000);

// Filtros del catálogo
const items = [...document.querySelectorAll('#catalogo .item')];
const filtros = [...document.querySelectorAll('.filtro')];
document.querySelectorAll('[data-conteo]').forEach((el) => {
  const cat = el.dataset.conteo;
  el.textContent = cat === 'todo' ? items.length : items.filter((i) => i.dataset.cat === cat).length;
});
const filtrar = (cat, animar) => {
  filtros.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === cat)));
  items.forEach((i) => {
    const mostrar = cat === 'todo' || i.dataset.cat === cat;
    i.hidden = !mostrar;
    i.classList.remove('aparecer');
    if (mostrar && animar && !reducirMovimiento) { void i.offsetWidth; i.classList.add('aparecer'); }
  });
};
items.forEach((i, n) => { i.style.viewTransitionName = `producto-${n}`; });
filtros.forEach((b) => b.addEventListener('click', () => {
  // Las tarjetas se deslizan a su nueva posición donde el navegador lo permite
  if (document.startViewTransition && !reducirMovimiento) document.startViewTransition(() => filtrar(b.dataset.filtro, false));
  else filtrar(b.dataset.filtro, true);
}));
filtrar('panaderia', false);

// Menú móvil
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu');
const cerrarMenu = () => {
  menu.classList.remove('abierto');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Abrir menú');
  toggle.querySelector('span').textContent = 'menu';
};
toggle.addEventListener('click', () => {
  const abierto = menu.classList.toggle('abierto');
  toggle.setAttribute('aria-expanded', String(abierto));
  toggle.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  toggle.querySelector('span').textContent = abierto ? 'close' : 'menu';
});
menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', cerrarMenu));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.classList.contains('abierto')) { cerrarMenu(); toggle.focus(); }
});

// Sombra del encabezado y enlace activo
const encabezado = document.getElementById('encabezado');
const enlacesMenu = [...menu.querySelectorAll('a')];
const secciones = enlacesMenu.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const alScroll = () => {
  encabezado.classList.toggle('con-sombra', window.scrollY > 8);
  const linea = window.scrollY + window.innerHeight * 0.35;
  let actual = secciones[0];
  secciones.forEach((s) => { if (s.offsetTop <= linea) actual = s; });
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) actual = secciones[secciones.length - 1];
  enlacesMenu.forEach((a) => {
    const activo = a.getAttribute('href') === `#${actual.id}`;
    a.classList.toggle('activo', activo);
    if (activo) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
};
let scrollPendiente = false;
window.addEventListener('scroll', () => {
  if (scrollPendiente) return;
  scrollPendiente = true;
  requestAnimationFrame(() => { scrollPendiente = false; alScroll(); ocultarEncabezado(); });
}, { passive: true });
alScroll();

// Aparición suave al hacer scroll
const revelables = document.querySelectorAll('.revelar');
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revelables.forEach((el) => obs.observe(el));
} else {
  revelables.forEach((el) => el.classList.add('visible'));
}

// Videos de las sedes: cada uno se reproduce solo cuando está a la vista
document.querySelectorAll('.video-local').forEach((contenedor) => {
  const video = contenedor.querySelector('video');
  const botonPausa = contenedor.querySelector('.pausa');
  const sede = document.getElementById(video.closest('.sede').getAttribute('aria-labelledby')).textContent;
  let pausadoPorUsuario = reducirMovimiento;
  const ponerIcono = () => {
    botonPausa.querySelector('span').textContent = video.paused ? 'play_arrow' : 'pause';
    botonPausa.setAttribute('aria-label', `${video.paused ? 'Reproducir video' : 'Pausar video'}: ${sede}`);
  };
  video.controls = false;
  botonPausa.hidden = false;
  botonPausa.addEventListener('click', () => {
    if (video.paused) { pausadoPorUsuario = false; video.play().catch(() => {}); }
    else { pausadoPorUsuario = true; video.pause(); }
  });
  video.addEventListener('play', ponerIcono);
  video.addEventListener('pause', ponerIcono);
  ponerIcono();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !pausadoPorUsuario) video.play().catch(() => {});
      else if (!e.isIntersecting) video.pause();
    }, { threshold: 0.4 }).observe(video);
  }
});

// Formulario → WhatsApp
const form = document.getElementById('form-pedido');
const estado = document.getElementById('estado-form');
const marcarError = (campo, mensaje) => {
  campo.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  document.getElementById(campo.getAttribute('aria-describedby')).textContent = mensaje;
};
form.addEventListener('submit', (e) => {
  e.preventDefault();
  estado.textContent = '';
  const { nombre, telefono: tel, mensaje } = form;
  const errNombre = nombre.value.trim().length < 2 ? 'Escribe tu nombre.' : '';
  const digitos = tel.value.replace(/\D/g, '');
  const errTel = tel.value.trim() && (digitos.length < 7 || digitos.length > 13) ? 'Revisa el número: debe tener entre 7 y 13 dígitos.' : '';
  const errMensaje = mensaje.value.trim().length < 5 ? 'Cuéntanos qué necesitas.' : '';
  marcarError(nombre, errNombre);
  marcarError(tel, errTel);
  marcarError(mensaje, errMensaje);
  const primerError = errNombre ? nombre : errTel ? tel : errMensaje ? mensaje : null;
  if (primerError) { primerError.focus(); return; }
  const lineas = [`Hola, Panes del Socorro. Soy ${nombre.value.trim()}.`, `Motivo: ${form.interes.value}`, '', mensaje.value.trim()];
  if (digitos) lineas.push('', `Mi número: ${tel.value.trim()}`);
  window.open(enlaceWa(lineas.join('\n')), '_blank', 'noopener');
  estado.textContent = 'Abrimos WhatsApp con tu mensaje. Solo falta que lo envíes.';
});
['nombre', 'telefono', 'mensaje'].forEach((n) => {
  form[n].addEventListener('input', () => { if (form[n].getAttribute('aria-invalid') === 'true') marcarError(form[n], ''); });
});

document.getElementById('anio').textContent = new Date().getFullYear();

// Encabezado que se esconde al bajar y vuelve al subir
let ultimoY = window.scrollY;
function ocultarEncabezado() {
  const y = window.scrollY;
  if (Math.abs(y - ultimoY) < 6) return;
  encabezado.classList.toggle('oculto', y > ultimoY && y > 400 && !menu.classList.contains('abierto'));
  ultimoY = y;
}
encabezado.addEventListener('focusin', () => encabezado.classList.remove('oculto'));

// Profundidad en las fotos del inicio según el mouse
const capas = document.querySelectorAll('.hero [data-profundidad]');
const punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (capas.length && punteroFino && !reducirMovimiento) {
  const hero = document.querySelector('.hero');
  let cuadro = 0;
  let mx = 0;
  let my = 0;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
    if (cuadro) return;
    cuadro = requestAnimationFrame(() => {
      cuadro = 0;
      capas.forEach((c) => {
        const d = Number(c.dataset.profundidad);
        c.style.translate = `${(-mx * d).toFixed(1)}px ${(-my * d).toFixed(1)}px`;
      });
    });
  });
  hero.addEventListener('pointerleave', () => capas.forEach((c) => { c.style.translate = '0px 0px'; }));
}

// Cifras que cuentan al aparecer
const contadores = document.querySelectorAll('[data-contar]');
const contar = (el) => {
  const fin = Number(el.dataset.contar);
  const sufijo = el.dataset.sufijo || '';
  const inicio = performance.now();
  const duracion = 1400;
  const paso = (t) => {
    const p = Math.min((t - inicio) / duracion, 1);
    el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))) + sufijo;
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
};
if (!reducirMovimiento && 'IntersectionObserver' in window) {
  const obsCifras = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => { if (e.isIntersecting) { contar(e.target); obsCifras.unobserve(e.target); } });
  }, { threshold: 0.6 });
  contadores.forEach((el) => { el.textContent = '0' + (el.dataset.sufijo || ''); obsCifras.observe(el); });
}

// Visor de fotos para las galerías
const visor = document.getElementById('visor');
const visorImg = document.getElementById('visor-img');
const visorTexto = document.getElementById('visor-texto');
let fotos = [];
let actual = 0;
const mostrarFoto = (i) => {
  actual = (i + fotos.length) % fotos.length;
  const img = fotos[actual];
  const src = img.currentSrc || img.src;
  if (visorImg.src !== src) {
    visorImg.classList.add('cambiando');
    visorImg.src = src;
  }
  visorImg.alt = img.alt;
  visorTexto.textContent = img.alt;
};
visorImg.addEventListener('load', () => visorImg.classList.remove('cambiando'));
document.querySelectorAll('[data-galeria]').forEach((galeria) => {
  const imgs = [...galeria.querySelectorAll('figure img')];
  imgs.forEach((img, i) => {
    const fig = img.closest('figure');
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', `Ampliar foto: ${img.alt}`);
    const abrir = () => {
      fotos = imgs;
      mostrarFoto(i);
      const varias = fotos.length > 1;
      visor.querySelector('.visor-ant').hidden = !varias;
      visor.querySelector('.visor-sig').hidden = !varias;
      visor.showModal();
      visor.querySelector('figure').focus();
    };
    fig.addEventListener('click', abrir);
    fig.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
  });
});
visor.querySelector('.visor-cerrar').addEventListener('click', () => visor.close());
visor.querySelector('.visor-ant').addEventListener('click', () => mostrarFoto(actual - 1));
visor.querySelector('.visor-sig').addEventListener('click', () => mostrarFoto(actual + 1));
visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
visor.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') mostrarFoto(actual - 1);
  if (e.key === 'ArrowRight') mostrarFoto(actual + 1);
});
let toqueX = null;
visorImg.addEventListener('pointerdown', (e) => { toqueX = e.clientX; });
visorImg.addEventListener('pointerup', (e) => {
  if (toqueX === null) return;
  const dx = e.clientX - toqueX;
  toqueX = null;
  if (Math.abs(dx) > 50) mostrarFoto(actual + (dx < 0 ? 1 : -1));
});

// Invitación de WhatsApp: aparece una sola vez por visita
const wa = document.querySelector('.wa-flotante');
let yaInvitado = false;
try { yaInvitado = sessionStorage.getItem('invitacion-wa') === '1'; } catch (e) { /* almacenamiento bloqueado */ }
if (!yaInvitado) {
  setTimeout(() => {
    wa.classList.add('llamar');
    setTimeout(() => wa.classList.remove('llamar'), 5000);
    try { sessionStorage.setItem('invitacion-wa', '1'); } catch (e) { /* almacenamiento bloqueado */ }
  }, 9000);
}
