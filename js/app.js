const StudioApp = (() => {
  const STORAGE_KEYS = {
    settings: "barbearia-rios-settings",
    appointments: "barbearia-rios-appointments",
    adminSession: "barbearia-rios-admin-session"
  };

  const DEFAULT_SETTINGS = {
    salonName: "Barbearia Rios",
    theme: {
      primary: "#1e1e1e",
      accent: "#b77945",
      surface: "#fffdf8"
    },
    professionals: [
      { id: "p1", name: "Anderson", role: "Especialista em Fade", rating: "4.9", hours: "09:00 - 18:00" },
      { id: "p2", name: "Bruno", role: "Barbeiro Premium", rating: "4.8", hours: "10:00 - 19:00" },
      { id: "p3", name: "Carlos", role: "Especialista em Barba", rating: "5.0", hours: "09:00 - 17:00" }
    ],
    services: [
      { id: "s1", name: "Corte", duration: 60, price: 45, icon: "CT", popular: true },
      { id: "s2", name: "Barba", duration: 30, price: 30, icon: "BB", popular: true },
      { id: "s3", name: "Corte + Barba", duration: 90, price: 70, icon: "CB", popular: false },
      { id: "s4", name: "Design de Barba", duration: 60, price: 50, icon: "DB", popular: false }
    ],
    products: [
      { id: "pd1", name: "Gel Modelador", price: 45, description: "Gel premium para modelagem", category: "Gel" },
      { id: "pd2", name: "Minoxidil 5%", price: 120, description: "Solucao para crescimento capilar", category: "Tratamento" },
      { id: "pd3", name: "Oleo de Barba", price: 65, description: "Oleo nobilitante para barba", category: "Barba" },
      { id: "pd4", name: "Shampoo Premium", price: 55, description: "Shampoo profissional de limpeza", category: "Higiene" }
    ],
    slots: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
    dayCapacity: 6,
    paymentMethods: [
      { id: "pm1", name: "Dinheiro", available: true },
      { id: "pm2", name: "Cartao Credito", available: true },
      { id: "pm3", name: "Cartao Debito", available: true },
      { id: "pm4", name: "PIX", available: true }
    ],
    professionalSchedules: {
      p1: { 0: "09:00-18:00", 1: "09:00-18:00", 2: "09:00-18:00", 3: "09:00-18:00", 4: "09:00-18:00", 5: "09:00-18:00", 6: "FECHADO" },
      p2: { 0: "10:00-19:00", 1: "10:00-19:00", 2: "10:00-19:00", 3: "10:00-19:00", 4: "10:00-19:00", 5: "10:00-20:00", 6: "FECHADO" },
      p3: { 0: "09:00-17:00", 1: "09:00-17:00", 2: "09:00-17:00", 3: "09:00-17:00", 4: "09:00-17:00", 5: "FECHADO", 6: "FECHADO" }
    }
  };

  function createId() {
    return Math.random().toString(36).slice(2, 10);
  }

  function toIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function makeDefaultAppointments() {
    return [];
  }

  function loadState(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : structuredClone(fallback);
    } catch (error) {
      return structuredClone(fallback);
    }
  }

  function persist(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getSettings() {
    return normalizeSettings(loadState(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
  }

  function saveSettings(settings) {
    persist(STORAGE_KEYS.settings, normalizeSettings(settings));
  }

  function normalizeSettings(settings) {
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      theme: {
        ...DEFAULT_SETTINGS.theme,
        ...(settings.theme || {})
      },
      professionals: (settings.professionals || DEFAULT_SETTINGS.professionals).map((professional, index) => ({
        ...DEFAULT_SETTINGS.professionals[index],
        ...professional
      })),
      services: (settings.services || DEFAULT_SETTINGS.services).map((service, index) => ({
        ...DEFAULT_SETTINGS.services[index],
        ...service,
        popular: typeof service.popular === "boolean" ? service.popular : Boolean(DEFAULT_SETTINGS.services[index]?.popular)
      })),
      products: (settings.products || DEFAULT_SETTINGS.products).map((product, index) => ({
        ...DEFAULT_SETTINGS.products[index],
        ...product
      })),
      paymentMethods: (settings.paymentMethods || DEFAULT_SETTINGS.paymentMethods).map((method, index) => ({
        ...DEFAULT_SETTINGS.paymentMethods[index],
        ...method
      })),
      slots: settings.slots || DEFAULT_SETTINGS.slots,
      dayCapacity: settings.dayCapacity || DEFAULT_SETTINGS.dayCapacity,
      professionalSchedules: {
        ...DEFAULT_SETTINGS.professionalSchedules,
        ...(settings.professionalSchedules || {})
      }
    };
  }

  function getAppointments() {
    return loadState(STORAGE_KEYS.appointments, makeDefaultAppointments());
  }

  function saveAppointments(appointments) {
    persist(STORAGE_KEYS.appointments, appointments);
    void syncAppointmentsToDatabase(appointments);
  }

  function normalizeAppointmentsCollection(appointments) {
    if (!appointments) {
      return [];
    }

    if (Array.isArray(appointments)) {
      return appointments.filter(Boolean);
    }

    return Object.entries(appointments).map(([id, appointment]) => ({
      ...appointment,
      id: appointment?.id || id
    }));
  }

  function canUseRemoteAppointments() {
    return typeof readFromFirebase === "function" && typeof writeToFirebase === "function";
  }

  async function loadAppointmentsFromDatabase() {
    if (!canUseRemoteAppointments()) {
      return getAppointments();
    }

    const remoteAppointments = await readFromFirebase("appointments");
    const normalizedAppointments = normalizeAppointmentsCollection(remoteAppointments);
    persist(STORAGE_KEYS.appointments, normalizedAppointments);
    return normalizedAppointments;
  }

  async function syncAppointmentsToDatabase(appointments) {
    if (!canUseRemoteAppointments()) {
      return appointments;
    }

    const payload = appointments.reduce((result, appointment) => {
      result[appointment.id] = appointment;
      return result;
    }, {});

    await writeToFirebase("appointments", payload);
    return appointments;
  }

  async function saveAppointmentsAndSync(appointments) {
    persist(STORAGE_KEYS.appointments, appointments);
    await syncAppointmentsToDatabase(appointments);
    return appointments;
  }

  function hasAppointmentConflict(appointments, candidate) {
    return appointments.some(
      (item) =>
        item.date === candidate.date &&
        item.time === candidate.time &&
        item.professionalId === candidate.professionalId &&
        item.status !== "cancelado" &&
        item.id !== candidate.id
    );
  }

  function applyTheme(settings) {
    document.documentElement.style.setProperty("--primary", settings.theme.primary);
    document.documentElement.style.setProperty("--accent", settings.theme.accent);
    document.documentElement.style.setProperty("--surface", settings.theme.surface);
    document.documentElement.style.setProperty("--accent-soft", hexToRgba(settings.theme.accent, 0.12));
  }

  function findService(settings, id) {
    return settings.services.find((service) => service.id === id);
  }

  function findProfessional(settings, id) {
    return settings.professionals.find((professional) => professional.id === id);
  }

  function getDayStats(appointments, settings, isoDate, professionalId) {
    // Check if professional is closed
    if (professionalId && isProfessionalClosedOnDay(settings, professionalId, isoDate)) {
      return {
        load: 0,
        ratio: 1,
        status: "fechado",
        label: "Fechado",
        isFull: true,
        description: "Profissional fechado neste dia."
      };
    }

    const relevantAppointments = appointments.filter(
      (item) => item.date === isoDate && item.status !== "cancelado" && (!professionalId || item.professionalId === professionalId)
    );

    const load = relevantAppointments.length;
    const ratio = load / settings.dayCapacity;
    let status = "livre";
    let label = "Livre";

    if (ratio >= 1) {
      status = "cheio";
      label = "Cheio";
    } else if (ratio >= 0.5) {
      status = "medio";
      label = "Medio";
    }

    return {
      load,
      ratio,
      status,
      label,
      isFull: ratio >= 1,
      description:
        status === "cheio"
          ? "Agenda lotada nesse dia para este profissional."
          : status === "medio"
            ? `Dia com boa procura. ${load} horario(s) ja preenchido(s).`
            : `Dia tranquilo. ${load} horario(s) reservado(s) ate agora.`
    };
  }

  function getDayStatsForAllProfessionals(appointments, settings, isoDate) {
    // Verifica se há pelo menos um profissional disponível neste dia
    const professionals = settings.professionals || [];
    
    // Se nenhum profissional, retorna fechado
    if (professionals.length === 0) {
      return {
        load: 0,
        ratio: 1,
        status: "fechado",
        label: "Fechado",
        isFull: true,
        description: "Nenhum profissional cadastrado."
      };
    }

    // Verifica quantos profissionais estão abertos neste dia
    const availableProfessionals = professionals.filter(
      (prof) => !isProfessionalClosedOnDay(settings, prof.id, isoDate)
    );

    // Se nenhum profissional está aberto
    if (availableProfessionals.length === 0) {
      return {
        load: 0,
        ratio: 1,
        status: "fechado",
        label: "Fechado",
        isFull: true,
        description: "Nenhum profissional está atendendo neste dia."
      };
    }

    // Pega todos os agendamentos do dia
    const dayAppointments = appointments.filter(
      (item) => item.date === isoDate && item.status !== "cancelado"
    );

    const totalLoad = dayAppointments.length;
    const totalCapacity = settings.dayCapacity * availableProfessionals.length;
    const ratio = totalLoad / totalCapacity;
    
    let status = "livre";
    let label = "Livre";

    if (ratio >= 1) {
      status = "cheio";
      label = "Cheio";
    } else if (ratio >= 0.5) {
      status = "medio";
      label = "Medio";
    }

    return {
      load: totalLoad,
      ratio,
      status,
      label,
      isFull: ratio >= 1,
      availableProfessionals: availableProfessionals.length,
      description:
        status === "cheio"
          ? "Dia cheio para todos os profissionais."
          : status === "medio"
            ? `${availableProfessionals.length} profissional(is) com boa procura.`
            : `${availableProfessionals.length} profissional(is) disponivel(is).`
    };
  }

  function isProfessionalClosedOnDay(settings, professionalId, isoDate) {
    const date = new Date(`${isoDate}T00:00:00`);
    const dayOfWeek = date.getDay();
    const schedule = settings.professionalSchedules[professionalId];
    if (!schedule) return false;
    const daySchedule = schedule[dayOfWeek];
    return daySchedule === "FECHADO";
  }

  function isTimeAvailableForProfessional(settings, professionalId, isoDate, time) {
    if (isProfessionalClosedOnDay(settings, professionalId, isoDate)) {
      return false;
    }

    const date = new Date(`${isoDate}T00:00:00`);
    const dayOfWeek = date.getDay();
    const schedule = settings.professionalSchedules[professionalId];
    if (!schedule) return true;

    const daySchedule = schedule[dayOfWeek];
    if (!daySchedule || daySchedule === "FECHADO") {
      return false;
    }

    const [openStr, closeStr] = daySchedule.split("-");
    const [openHour, openMin] = openStr.split(":").map(Number);
    const [closeHour, closeMin] = closeStr.split(":").map(Number);
    const [timeHour, timeMin] = time.split(":").map(Number);

    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    const slotTime = timeHour * 60 + timeMin;

    return slotTime >= openTime && slotTime < closeTime;
  }

  function getAvailableSlotsForProfessional(settings, professionalId, isoDate) {
    if (isProfessionalClosedOnDay(settings, professionalId, isoDate)) {
      return [];
    }

    const date = new Date(`${isoDate}T00:00:00`);
    const dayOfWeek = date.getDay();
    const schedule = settings.professionalSchedules[professionalId];
    if (!schedule) return [];

    const daySchedule = schedule[dayOfWeek];
    if (!daySchedule || daySchedule === "FECHADO") {
      return [];
    }

    // Parse schedule to get open and close times
    const [openStr, closeStr] = daySchedule.split("-");
    const [openHour, openMin] = openStr.split(":").map(Number);
    const [closeHour, closeMin] = closeStr.split(":").map(Number);

    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    // Generate 15-minute slots
    const slots = [];
    for (let time = openTime; time < closeTime; time += 15) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      const slotTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      slots.push(slotTime);
    }

    return slots;
  }

  function getBlockedSlotsForAppointment(appointments, settings, isoDate, professionalId, serviceId) {
    // Get all appointments for this professional on this date
    const dayAppointments = appointments.filter(
      (apt) =>
        apt.date === isoDate &&
        apt.professionalId === professionalId &&
        apt.status !== "cancelado"
    );

    const blockedSlots = new Set();

    // For each appointment, block the slots it occupies based on its duration
    dayAppointments.forEach((apt) => {
      const [aptHour, aptMin] = apt.time.split(":").map(Number);
      const aptStartTime = aptHour * 60 + aptMin;
      
      // Get the duration of the service that was already booked
      const bookedService = findService(settings, apt.serviceId);
      const bookedServiceDuration = bookedService?.duration || 60;
      const aptEndTime = aptStartTime + bookedServiceDuration;

      // Add all slots that overlap with this appointment
      for (let slotTime = aptStartTime; slotTime < aptEndTime; slotTime += 15) {
        const hours = Math.floor(slotTime / 60);
        const minutes = slotTime % 60;
        const slotStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        blockedSlots.add(slotStr);
      }
    });

    return blockedSlots;
  }

  function buildCalendarDays(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startShift = firstDay.getDay();
    const totalCells = Math.ceil((startShift + lastDay.getDate()) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const cellDate = new Date(year, month, index - startShift + 1);
      return { date: cellDate };
    });
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function monthLabel(date) {
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
  }

  function formatDate(isoDate) {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(new Date(`${isoDate}T12:00:00`));
  }

  function formatDateShort(isoDate) {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(`${isoDate}T12:00:00`));
  }

  function formatDateTime(date) {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
  }

  function currency(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function setAdminSession(isLoggedIn) {
    sessionStorage.setItem(STORAGE_KEYS.adminSession, JSON.stringify(isLoggedIn));
  }

  function hasAdminSession() {
    return sessionStorage.getItem(STORAGE_KEYS.adminSession) === "true";
  }

  function initSecretAdminTrigger() {
    const trigger = document.querySelector("[data-secret-admin]");
    if (!trigger) {
      return;
    }

    let clicks = 0;
    let timerId = null;

    trigger.addEventListener("click", () => {
      clicks += 1;
      clearTimeout(timerId);
      timerId = window.setTimeout(() => {
        clicks = 0;
      }, 1800);

      if (clicks >= 5) {
        clicks = 0;
        window.location.href = "admin.html";
      }
    });
  }

  function addProfessional(settings, professional) {
    if (!professional.id) {
      professional.id = createId();
    }
    if (!professional.rating) {
      professional.rating = "5.0";
    }
    if (!professional.hours) {
      professional.hours = "09:00 - 18:00";
    }
    settings.professionals.push(professional);
    settings.professionalSchedules[professional.id] = {
      0: "09:00-18:00",
      1: "09:00-18:00",
      2: "09:00-18:00",
      3: "09:00-18:00",
      4: "09:00-18:00",
      5: "09:00-18:00",
      6: "FECHADO"
    };
    return settings;
  }

  function removeProfessional(settings, professionalId) {
    settings.professionals = settings.professionals.filter((p) => p.id !== professionalId);
    delete settings.professionalSchedules[professionalId];
    // Remove agendamentos deste profissional
    const appointments = getAppointments();
    const filtered = appointments.filter((apt) => apt.professionalId !== professionalId);
    saveAppointments(filtered);
    return settings;
  }

  function getMonthlyStats(month = null, year = null) {
    const now = new Date();
    const targetMonth = month !== null ? month : now.getMonth();
    const targetYear = year !== null ? year : now.getFullYear();
    
    const appointments = getAppointments();
    const settings = getSettings();
    
    const monthStart = new Date(targetYear, targetMonth, 1);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0);
    
    const monthAppointments = appointments.filter((apt) => {
      const aptDate = new Date(`${apt.date}T00:00:00`);
      return aptDate >= monthStart && aptDate <= monthEnd;
    });
    
    const confirmedAppointments = monthAppointments.filter((apt) => ["confirmado", "concluido"].includes(apt.status));
    const totalRevenue = confirmedAppointments.reduce((sum, apt) => {
      const service = findService(settings, apt.serviceId);
      return sum + (service?.price || 0);
    }, 0);
    
    return {
      month: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(monthStart),
      totalRevenue,
      appointments: monthAppointments,
      totalAppointments: monthAppointments.length,
      confirmedAppointments: confirmedAppointments.length,
      pendingAppointments: monthAppointments.filter((apt) => apt.status === "pendente").length,
      cancelledAppointments: monthAppointments.filter((apt) => apt.status === "cancelado").length,
      completedAppointments: monthAppointments.filter((apt) => apt.status === "concluido").length
    };
  }

  return {
    STORAGE_KEYS,
    DEFAULT_SETTINGS,
    createId,
    toIsoDate,
    getSettings,
    saveSettings,
    getAppointments,
    saveAppointments,
    loadAppointmentsFromDatabase,
    saveAppointmentsAndSync,
    syncAppointmentsToDatabase,
    hasAppointmentConflict,
    applyTheme,
    findService,
    findProfessional,
    getDayStats,
    getDayStatsForAllProfessionals,
    isProfessionalClosedOnDay,
    isTimeAvailableForProfessional,
    getAvailableSlotsForProfessional,
    getBlockedSlotsForAppointment,
    buildCalendarDays,
    startOfMonth,
    startOfDay,
    monthLabel,
    formatDate,
    formatDateShort,
    formatDateTime,
    currency,
    capitalize,
    setAdminSession,
    hasAdminSession,
    initSecretAdminTrigger,
    addProfessional,
    removeProfessional,
    getMonthlyStats
  };
})();
