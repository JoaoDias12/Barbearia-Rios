const bookingState = {
  settings: StudioApp.getSettings(),
  appointments: StudioApp.getAppointments(),
  currentStep: 1,
  currentMonth: StudioApp.startOfMonth(new Date()),
  selectedServiceId: null,
  selectedProfessionalId: null,
  selectedDate: null,
  selectedTime: null,
  showAllServices: false
};

const bookingElements = {
  servicesGrid: document.getElementById("servicesGrid"),
  professionalsGrid: document.getElementById("professionalsGrid"),
  calendarWeekdays: document.getElementById("calendarWeekdays"),
  calendarDays: document.getElementById("calendarDays"),
  calendarMonthLabel: document.getElementById("calendarMonthLabel"),
  selectedDateLabel: document.getElementById("selectedDateLabel"),
  selectedDayStatus: document.getElementById("selectedDayStatus"),
  timesGrid: document.getElementById("timesGrid"),
  availabilityHeadline: document.getElementById("availabilityHeadline"),
  availabilityText: document.getElementById("availabilityText"),
  bookingForm: document.getElementById("bookingForm"),
  summaryService: document.getElementById("summaryService"),
  summaryProfessional: document.getElementById("summaryProfessional"),
  summaryDate: document.getElementById("summaryDate"),
  summaryTime: document.getElementById("summaryTime"),
  summaryPrice: document.getElementById("summaryPrice"),
  productsGrid: document.getElementById("productsGrid"),
  paymentMethod: document.getElementById("paymentMethod"),
  heroAppointmentsCount: document.getElementById("heroAppointmentsCount"),
  heroProfessionalsCount: document.getElementById("heroProfessionalsCount"),
  heroPendingCount: document.getElementById("heroPendingCount"),
  footerNow: document.getElementById("footerNow")
};

void initBookingPage();

async function initBookingPage() {
  StudioApp.applyTheme(bookingState.settings);
  StudioApp.initSecretAdminTrigger();
  bookingState.appointments = await StudioApp.loadAppointmentsFromDatabase();
  bookingState.selectedServiceId = bookingState.settings.services[0]?.id || null;
  bookingState.selectedProfessionalId = bookingState.settings.professionals[0]?.id || null;
  renderBookingStatic();
  bindBookingEvents();
  renderBookingAll();
}

async function refreshBookingAppointments() {
  bookingState.appointments = await StudioApp.loadAppointmentsFromDatabase();
  renderHeroStats();
  renderCalendar();
  renderTimes();
  renderSummary();
}

function renderBookingStatic() {
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  bookingElements.calendarWeekdays.innerHTML = weekdays.map((day) => `<div class="weekday">${day}</div>`).join("");
  bookingElements.footerNow.textContent = `Atualizado em ${StudioApp.formatDateTime(new Date())}`;
}

function bindBookingEvents() {
  document.querySelectorAll(".step-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const targetStep = Number(pill.dataset.stepTarget);
      if (targetStep <= bookingState.currentStep || canProceedTo(targetStep)) {
        goToBookingStep(targetStep);
      }
    });
  });

  document.querySelectorAll("[data-next-step]").forEach((button) => {
    button.addEventListener("click", async () => {
      const nextStep = Number(button.dataset.nextStep);
      if (nextStep >= 3) {
        await refreshBookingAppointments();
      }
      if (canProceedTo(nextStep)) {
        goToBookingStep(nextStep);
      }
    });
  });

  document.querySelectorAll("[data-prev-step]").forEach((button) => {
    button.addEventListener("click", () => goToBookingStep(Number(button.dataset.prevStep)));
  });

  document.getElementById("prevMonth").addEventListener("click", () => {
    bookingState.currentMonth = new Date(bookingState.currentMonth.getFullYear(), bookingState.currentMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    bookingState.currentMonth = new Date(bookingState.currentMonth.getFullYear(), bookingState.currentMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  bookingElements.bookingForm.addEventListener("submit", handleBookingSubmit);
}

function renderBookingAll() {
  renderHeroStats();
  renderServices();
  renderProducts();
  renderPaymentMethods();
  renderProfessionals();
  renderCalendar();
  renderTimes();
  renderSummary();
  renderStepper();
}

function renderHeroStats() {
  if (
    !bookingElements.heroAppointmentsCount ||
    !bookingElements.heroProfessionalsCount ||
    !bookingElements.heroPendingCount
  ) {
    return;
  }

  const todayIso = StudioApp.toIsoDate(new Date());
  bookingElements.heroAppointmentsCount.textContent = String(bookingState.appointments.length);
  bookingElements.heroProfessionalsCount.textContent = String(bookingState.settings.professionals.length);
  bookingElements.heroPendingCount.textContent = String(
    bookingState.appointments.filter((item) => item.date === todayIso && !["cancelado", "concluido"].includes(item.status)).length
  );
}

function renderServices() {
  const popularServices = bookingState.settings.services.filter((service) => service.popular);
  const extraServices = bookingState.settings.services.filter((service) => !service.popular);

  const renderCard = (service) => `
      <button class="selection-card ${service.id === bookingState.selectedServiceId ? "active" : ""}" data-service-id="${service.id}">
        <div class="selection-card__top">
          <div class="selection-card__title">
            <span class="selection-icon">${service.icon}</span>
            <div>
              <strong>${service.name}</strong>
              <span>${service.duration} min</span>
            </div>
          </div>
          <span class="selection-price">${StudioApp.currency(service.price)}</span>
        </div>
      </button>
    `;

  bookingElements.servicesGrid.innerHTML = `
    ${popularServices.length ? `
      <div class="services-block">
        <div class="services-block__header">
          <div>
            <span class="services-tag">Populares</span>
            <h4>Os mais pedidos</h4>
          </div>
        </div>
        <div class="selection-grid">
          ${popularServices.map(renderCard).join("")}
        </div>
      </div>
    ` : ""}

    ${extraServices.length ? `
      <div class="services-block">
        <div class="services-block__header">
          <div>
            <span class="services-tag">Outros servicos</span>
            <h4>Mais opcoes</h4>
          </div>
          <button type="button" class="ghost-btn services-toggle-btn" id="servicesToggleBtn">
            ${bookingState.showAllServices ? "Ocultar" : "Mais"}
          </button>
        </div>
        <div class="selection-grid ${bookingState.showAllServices ? "" : "hidden"}" id="moreServicesGrid">
          ${extraServices.map(renderCard).join("")}
        </div>
      </div>
    ` : ""}
  `;

  const toggleButton = document.getElementById("servicesToggleBtn");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      bookingState.showAllServices = !bookingState.showAllServices;
      renderServices();
    });
  }

  bookingElements.servicesGrid.querySelectorAll("[data-service-id]").forEach((button) => {
    button.addEventListener("click", () => {
      bookingState.selectedServiceId = button.dataset.serviceId;
      renderServices();
      renderSummary();
    });
  });
}

function renderProducts() {
  if (!bookingElements.productsGrid) {
    return;
  }

  const products = bookingState.settings.products || [];
  
  if (!products.length) {
    bookingElements.productsGrid.innerHTML = "<div class='empty-state'>Nenhum produto disponivel.</div>";
    return;
  }

  bookingElements.productsGrid.innerHTML = products
    .map((product) => `
      <div class="selection-card" style="cursor: pointer;">
        <div class="selection-card__top">
          <div class="selection-card__title">
            <span class="selection-icon">📦</span>
            <div>
              <strong>${product.name}</strong>
              <span>${product.category}</span>
            </div>
          </div>
          <span class="selection-price">${StudioApp.currency(product.price)}</span>
        </div>
        <p style="margin: 10px 0 0; font-size: 0.9rem; color: var(--muted);">${product.description || "Produto de qualidade"}</p>
      </div>
    `)
    .join("");
}

function renderPaymentMethods() {
  if (!bookingElements.paymentMethod) {
    return;
  }

  const methods = bookingState.settings.paymentMethods || [];
  
  bookingElements.paymentMethod.innerHTML = `
    <option value="">Selecione a forma de pagamento</option>
    ${methods
      .filter((m) => m.available)
      .map((method) => `<option value="${method.id}">${method.name}</option>`)
      .join("")}
  `;
}

function renderProfessionals() {
  bookingElements.professionalsGrid.innerHTML = bookingState.settings.professionals
    .map((professional) => `
      <button class="selection-card ${professional.id === bookingState.selectedProfessionalId ? "active" : ""}" data-professional-id="${professional.id}">
        <div class="selection-card__top">
          <div>
            <strong>${professional.name}</strong>
            <p>${professional.role}</p>
          </div>
          <span class="selection-price">${professional.rating}</span>
        </div>
        <span>${professional.hours}</span>
      </button>
    `)
    .join("");

  bookingElements.professionalsGrid.querySelectorAll("[data-professional-id]").forEach((button) => {
    button.addEventListener("click", () => {
      bookingState.selectedProfessionalId = button.dataset.professionalId;
      bookingState.selectedDate = null;
      bookingState.selectedTime = null;
      renderProfessionals();
      renderCalendar();
      renderTimes();
      renderSummary();
    });
  });
}

function renderCalendar() {
  bookingElements.calendarMonthLabel.textContent = StudioApp.monthLabel(bookingState.currentMonth);
  const days = StudioApp.buildCalendarDays(bookingState.currentMonth);

  bookingElements.calendarDays.innerHTML = days
    .map((day) => {
      const iso = StudioApp.toIsoDate(day.date);
      const otherMonth = day.date.getMonth() !== bookingState.currentMonth.getMonth();
      const past = StudioApp.startOfDay(day.date) < StudioApp.startOfDay(new Date());
      // Usar getDayStatsForAllProfessionals para verificar se algum barbeiro atende
      const stats = StudioApp.getDayStatsForAllProfessionals(bookingState.appointments, bookingState.settings, iso);
      
      const status = otherMonth ? "outro" : stats.status;
      const selected = bookingState.selectedDate === iso;
      const disabled = otherMonth || past || stats.isFull;

      return `
        <button class="day-btn status-${status} ${selected ? "selected" : ""}" data-date="${iso}" ${disabled ? "disabled" : ""}>
          <strong>${day.date.getDate()}</strong>
          <small>${otherMonth ? "" : stats.label}</small>
        </button>
      `;
    })
    .join("");

  bookingElements.calendarDays.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("click", async () => {
      await refreshBookingAppointments();
      bookingState.selectedDate = button.dataset.date;
      bookingState.selectedTime = null;
      renderCalendar();
      renderTimes();
      renderSummary();
      updateAvailabilityAside();
    });
  });

  updateAvailabilityAside();
}

function renderTimes() {
  if (!bookingState.selectedDate) {
    bookingElements.selectedDateLabel.textContent = "Selecione um dia";
    bookingElements.selectedDayStatus.textContent = "Escolha um dia no calendario para ver os horarios.";
    bookingElements.timesGrid.innerHTML = `<div class="empty-state">Nenhum horario exibido ainda.</div>`;
    return;
  }

  // Check if professional is closed on this day
  const isClosed = StudioApp.isProfessionalClosedOnDay(
    bookingState.settings,
    bookingState.selectedProfessionalId,
    bookingState.selectedDate
  );

  if (isClosed) {
    bookingElements.selectedDateLabel.textContent = StudioApp.formatDate(bookingState.selectedDate);
    bookingElements.selectedDayStatus.textContent = "Este profissional está fechado neste dia.";
    bookingElements.timesGrid.innerHTML = `<div class="empty-state">Profissional não disponível neste dia.</div>`;
    return;
  }

  const dayStats = StudioApp.getDayStats(
    bookingState.appointments,
    bookingState.settings,
    bookingState.selectedDate,
    bookingState.selectedProfessionalId
  );
  bookingElements.selectedDateLabel.textContent = StudioApp.formatDate(bookingState.selectedDate);
  bookingElements.selectedDayStatus.textContent = dayStats.description;

  // Get only available slots for this professional (15-minute intervals)
  const availableSlots = StudioApp.getAvailableSlotsForProfessional(
    bookingState.settings,
    bookingState.selectedProfessionalId,
    bookingState.selectedDate
  );

  // Get slots that are blocked due to existing appointments and service duration
  const blockedSlots = StudioApp.getBlockedSlotsForAppointment(
    bookingState.appointments,
    bookingState.settings,
    bookingState.selectedDate,
    bookingState.selectedProfessionalId,
    bookingState.selectedServiceId
  );

  if (availableSlots.length === 0) {
    bookingElements.timesGrid.innerHTML = `<div class="empty-state">Sem horarios disponiveis para este dia.</div>`;
    return;
  }

  bookingElements.timesGrid.innerHTML = availableSlots
    .map((slot) => {
      const isBlocked = blockedSlots.has(slot);
      return `
        <button class="time-chip ${bookingState.selectedTime === slot ? "selected" : ""}" data-time="${slot}" ${isBlocked ? "disabled" : ""}>
          ${slot}
        </button>
      `;
    })
    .join("");

  bookingElements.timesGrid.querySelectorAll("[data-time]").forEach((button) => {
    button.addEventListener("click", () => {
      bookingState.selectedTime = button.dataset.time;
      renderTimes();
      renderSummary();
    });
  });
}

function renderSummary() {
  const service = StudioApp.findService(bookingState.settings, bookingState.selectedServiceId);
  const professional = StudioApp.findProfessional(bookingState.settings, bookingState.selectedProfessionalId);
  bookingElements.summaryService.textContent = service ? service.name : "-";
  bookingElements.summaryProfessional.textContent = professional ? professional.name : "-";
  bookingElements.summaryDate.textContent = bookingState.selectedDate ? StudioApp.formatDate(bookingState.selectedDate) : "-";
  bookingElements.summaryTime.textContent = bookingState.selectedTime || "-";
  bookingElements.summaryPrice.textContent = service ? StudioApp.currency(service.price) : "R$ 0";
}

function renderStepper() {
  document.querySelectorAll(".step-pill").forEach((pill) => {
    pill.classList.toggle("active", Number(pill.dataset.stepTarget) === bookingState.currentStep);
  });
  document.querySelectorAll(".step-panel").forEach((panel) => {
    panel.classList.toggle("active", Number(panel.dataset.step) === bookingState.currentStep);
  });
}

function updateAvailabilityAside() {
  if (!bookingElements.availabilityHeadline || !bookingElements.availabilityText) {
    return;
  }

  if (!bookingState.selectedDate) {
    bookingElements.availabilityHeadline.textContent = "Sem dia escolhido";
    bookingElements.availabilityText.textContent = "Quando voce clicar em um quadrado do calendario, este painel resume como esta a agenda.";
    return;
  }

  const stats = StudioApp.getDayStats(
    bookingState.appointments,
    bookingState.settings,
    bookingState.selectedDate,
    bookingState.selectedProfessionalId
  );
  bookingElements.availabilityHeadline.textContent = `${StudioApp.formatDate(bookingState.selectedDate)} - ${stats.label}`;
  bookingElements.availabilityText.textContent = stats.description;
}

function canProceedTo(nextStep) {
  if (nextStep === 2 && !bookingState.selectedServiceId) {
    alert("Escolha um servico primeiro.");
    return false;
  }
  if (nextStep === 3 && !bookingState.selectedProfessionalId) {
    alert("Escolha um profissional primeiro.");
    return false;
  }
  if ((nextStep === 4 || nextStep === 5) && (!bookingState.selectedDate || !bookingState.selectedTime)) {
    alert("Escolha data e horario antes de continuar.");
    return false;
  }
  return true;
}

function goToBookingStep(step) {
  bookingState.currentStep = step;
  renderStepper();
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  if (!canProceedTo(5)) {
    return;
  }

  const paymentMethodId = document.getElementById("paymentMethod").value;
  if (!paymentMethodId) {
    alert("Selecione uma forma de pagamento.");
    return;
  }

  const appointment = {
    id: StudioApp.createId(),
    serviceId: bookingState.selectedServiceId,
    professionalId: bookingState.selectedProfessionalId,
    date: bookingState.selectedDate,
    time: bookingState.selectedTime,
    customer: {
      name: document.getElementById("clientName").value.trim(),
      phone: document.getElementById("clientPhone").value.trim(),
      email: document.getElementById("clientEmail").value.trim(),
      notes: document.getElementById("clientNotes").value.trim()
    },
    paymentMethod: paymentMethodId,
    status: "confirmado",
    createdAt: new Date().toISOString()
  };

  if (!appointment.customer.name || !appointment.customer.phone || !appointment.customer.email) {
    alert("Preencha nome, telefone e e-mail.");
    return;
  }

  await refreshBookingAppointments();

  const conflict = StudioApp.hasAppointmentConflict(bookingState.appointments, appointment);

  if (conflict) {
    alert("Esse horario ja foi marcado no sistema. Escolha outro horario.");
    bookingState.selectedTime = null;
    renderTimes();
    renderSummary();
    return;
  }

  bookingState.appointments.push(appointment);
  await StudioApp.saveAppointmentsAndSync(bookingState.appointments);
  bookingElements.bookingForm.reset();
  bookingState.selectedDate = null;
  bookingState.selectedTime = null;
  goToBookingStep(1);
  renderBookingAll();
  location.href = "meus-agendamentos.html";
}
