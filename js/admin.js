const ADMIN_USER = "Dias";
const ADMIN_PASSWORD = "12234";

const adminState = {
  settings: StudioApp.getSettings(),
  appointments: StudioApp.getAppointments(),
  agendaCurrentMonth: StudioApp.startOfMonth(new Date()),
  agendaSelectedDate: null,
  themeExpanded: false
};

const adminEls = {
  loginShell: document.getElementById("adminLoginShell"),
  panelShell: document.getElementById("adminPanelShell"),
  loginForm: document.getElementById("adminLoginForm"),
  loginError: document.getElementById("adminLoginError"),
  logoutBtn: document.getElementById("logoutBtn"),
  themeForm: document.getElementById("themeForm"),
  themeCard: document.getElementById("themeCard"),
  themePreview: document.getElementById("themePreview"),
  previewPrimary: document.getElementById("previewPrimary"),
  previewAccent: document.getElementById("previewAccent"),
  previewSurface: document.getElementById("previewSurface"),
  professionalsForm: document.getElementById("professionalsForm"),
  professionalsEditor: document.getElementById("professionalsEditor"),
  addProfessionalBtn: document.getElementById("addProfessionalBtn"),
  servicesForm: document.getElementById("servicesForm"),
  addServiceBtn: document.getElementById("addServiceBtn"),
  themePrimary: document.getElementById("themePrimary"),
  themeAccent: document.getElementById("themeAccent"),
  themeSurface: document.getElementById("themeSurface"),
  servicesEditor: document.getElementById("servicesEditor"),
  productsForm: document.getElementById("productsForm"),
  productsEditor: document.getElementById("productsEditor"),
  addProductBtn: document.getElementById("addProductBtn"),
  schedulesForm: document.getElementById("schedulesForm"),
  schedulesEditor: document.getElementById("schedulesEditor"),
  agendaPrevMonth: document.getElementById("agendaPrevMonth"),
  agendaNextMonth: document.getElementById("agendaNextMonth"),
  agendaMonthLabel: document.getElementById("agendaMonthLabel"),
  agendaCalendarWeekdays: document.getElementById("agendaCalendarWeekdays"),
  agendaCalendarDays: document.getElementById("agendaCalendarDays"),
  agendaDayView: document.getElementById("agendaDayView"),
  monthPicker: document.getElementById("monthPicker"),
  salesReportView: document.getElementById("salesReportView"),
  adminBookings: document.getElementById("adminBookings"),
  footerNow: document.getElementById("footerNow")
};

void initAdminPage();

async function initAdminPage() {
  adminState.settings = await StudioApp.loadSettingsFromDatabase();
  adminState.appointments = await StudioApp.loadAppointmentsFromDatabase();
  StudioApp.applyTheme(adminState.settings);
  adminEls.footerNow.textContent = `Atualizado em ${StudioApp.formatDateTime(new Date())}`;
  syncThemeInputs();
  bindAdminEvents();
  await updateAdminVisibility();
}

function bindAdminEvents() {
  adminEls.loginForm.addEventListener("submit", handleAdminLogin);
  adminEls.logoutBtn.addEventListener("click", async () => {
    StudioApp.setAdminSession(false);
    await updateAdminVisibility();
  });
  adminEls.themeForm.addEventListener("submit", handleThemeSubmit);
  adminEls.themePrimary.addEventListener("change", updateThemePreview);
  adminEls.themeAccent.addEventListener("change", updateThemePreview);
  adminEls.themeSurface.addEventListener("change", updateThemePreview);
  adminEls.professionalsForm.addEventListener("submit", handleProfessionalsSubmit);
  adminEls.addProfessionalBtn.addEventListener("click", handleAddProfessional);
  adminEls.servicesForm.addEventListener("submit", handleServicesSubmit);
  adminEls.addServiceBtn.addEventListener("click", handleAddService);
  adminEls.productsForm.addEventListener("submit", handleProductsSubmit);
  adminEls.addProductBtn.addEventListener("click", handleAddProduct);
  adminEls.schedulesForm.addEventListener("submit", handleSchedulesSubmit);
  adminEls.agendaPrevMonth.addEventListener("click", () => {
    adminState.agendaCurrentMonth = new Date(adminState.agendaCurrentMonth.getFullYear(), adminState.agendaCurrentMonth.getMonth() - 1, 1);
    renderAgendaCalendar();
  });
  adminEls.agendaNextMonth.addEventListener("click", () => {
    adminState.agendaCurrentMonth = new Date(adminState.agendaCurrentMonth.getFullYear(), adminState.agendaCurrentMonth.getMonth() + 1, 1);
    renderAgendaCalendar();
  });
  adminEls.monthPicker.addEventListener("change", renderSalesReport);  
  // Adicionar event listener para botão de download
  const downloadBtn = document.getElementById("downloadReportBtn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadSalesReportPDF);
  }
}

async function updateAdminVisibility() {
  const loggedIn = StudioApp.hasAdminSession();
  adminEls.loginShell.classList.toggle("hidden", loggedIn);
  adminEls.panelShell.classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    adminState.settings = await StudioApp.loadSettingsFromDatabase();
    adminState.appointments = await StudioApp.loadAppointmentsFromDatabase();
    StudioApp.applyTheme(adminState.settings);
    syncThemeInputs();
    renderProfessionalsEditor();
    renderAdminEditors();
    renderProductsEditor();
    renderSchedulesEditor();
    renderAdminAppointments();
    
    // Set default dates for agenda and sales report
    const today = StudioApp.toIsoDate(new Date());
    adminState.agendaSelectedDate = today;
    adminState.agendaCurrentMonth = StudioApp.startOfMonth(new Date());
    renderAgendaCalendar();
    renderAgendaDay(today);
    
    const now = new Date();
    adminEls.monthPicker.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    renderSalesReport();
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    StudioApp.setAdminSession(true);
    adminEls.loginError.textContent = "";
    adminEls.loginForm.reset();
    await updateAdminVisibility();
    return;
  }

  adminEls.loginError.textContent = "Usuario ou senha incorretos.";
}

function syncThemeInputs() {
  adminEls.themePrimary.value = adminState.settings.theme.primary;
  adminEls.themeAccent.value = adminState.settings.theme.accent;
  adminEls.themeSurface.value = adminState.settings.theme.surface;
  updateThemePreview();
}

function updateThemePreview() {
  adminEls.previewPrimary.style.backgroundColor = adminEls.themePrimary.value;
  adminEls.previewAccent.style.backgroundColor = adminEls.themeAccent.value;
  adminEls.previewSurface.style.backgroundColor = adminEls.themeSurface.value;
}

function toggleThemeExpanded() {
  adminState.themeExpanded = !adminState.themeExpanded;
  const formContent = adminEls.themeCard.querySelector("#themeForm");
  
  if (adminState.themeExpanded) {
    formContent.classList.add("expanded");
    btn.textContent = "⌃";
  } else {
    formContent.classList.remove("expanded");
    btn.textContent = "⌄";
  }
}

function renderAdminEditors() {
  adminEls.servicesEditor.innerHTML = adminState.settings.services
    .map(
      (service) => `
        <div class="editable-row" style="grid-template-columns: 1.2fr 0.7fr 0.8fr 0.6fr 0.5fr;">
          <label class="field">
            <span>Servico</span>
            <input type="text" value="${service.name}" data-service-field="name" data-service-id="${service.id}">
          </label>
          <label class="field">
            <span>Preco</span>
            <input type="number" min="0" step="1" value="${service.price}" data-service-field="price" data-service-id="${service.id}">
          </label>
          <label class="field">
            <span>Duracao</span>
            <input type="number" min="15" step="15" value="${service.duration}" data-service-field="duration" data-service-id="${service.id}">
          </label>
          <label class="field popular-check" style="align-self: flex-end;">
            <span>Popular</span>
            <input type="checkbox" ${service.popular ? "checked" : ""} data-service-field="popular" data-service-id="${service.id}">
          </label>
          <label class="field popular-check">
            <span>X</span>
            <button type="button" class="danger-btn" data-remove-service="${service.id}" style="width: 100%; padding: 10px;">Excluir</button>
          </label>
        </div>
      `
    )
    .join("");
    
  // Add change listeners for auto-save
  adminEls.servicesEditor.querySelectorAll("[data-service-field]").forEach((field) => {
    field.addEventListener("change", () => {
      handleServicesSubmit({ preventDefault: () => {} });
    });
  });
  
  // Add remove button listeners
  adminEls.servicesEditor.querySelectorAll("[data-remove-service]").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const serviceId = button.dataset.removeService;
      adminState.settings.services = adminState.settings.services.filter((s) => s.id !== serviceId);
      StudioApp.saveSettings(adminState.settings);
      renderAdminEditors();
    });
  });
}

function renderProfessionalsEditor() {
  adminEls.professionalsEditor.innerHTML = adminState.settings.professionals
    .map(
      (professional) => `
        <div class="editable-row" style="grid-template-columns: 1fr 1fr 0.8fr 0.8fr 0.5fr;">
          <label class="field">
            <span>Nome</span>
            <input type="text" value="${professional.name}" data-professional-field="name" data-professional-id="${professional.id}">
          </label>
          <label class="field">
            <span>Especialidade</span>
            <input type="text" value="${professional.role}" data-professional-field="role" data-professional-id="${professional.id}">
          </label>
          <label class="field">
            <span>Avaliacao</span>
            <input type="number" min="0" max="5" step="0.1" value="${professional.rating}" data-professional-field="rating" data-professional-id="${professional.id}">
          </label>
          <label class="field">
            <span>Horarios</span>
            <input type="text" value="${professional.hours}" data-professional-field="hours" data-professional-id="${professional.id}" placeholder="09:00 - 18:00">
          </label>
          <label class="field popular-check">
            <span>X</span>
            <button type="button" class="danger-btn" data-remove-professional="${professional.id}" style="width: 100%; padding: 10px;">Remover</button>
          </label>
        </div>
      `
    )
    .join("");
    
  // Add change listeners
  adminEls.professionalsEditor.querySelectorAll("[data-professional-field]").forEach((field) => {
    field.addEventListener("change", () => {
      handleProfessionalsSubmit({ preventDefault: () => {} });
    });
  });
  
  // Add remove button listeners
  adminEls.professionalsEditor.querySelectorAll("[data-remove-professional]").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const professionalId = button.dataset.removeProfessional;
      adminState.settings = StudioApp.removeProfessional(adminState.settings, professionalId);
      StudioApp.saveSettings(adminState.settings);
      renderProfessionalsEditor();
      renderSchedulesEditor();
    });
  });
}

function handleAddProfessional(e) {
  e.preventDefault();
  const newProfessional = {
    name: "Novo Barbeiro",
    role: "Especialista",
    rating: "5.0",
    hours: "09:00 - 18:00"
  };
  adminState.settings = StudioApp.addProfessional(adminState.settings, newProfessional);
  StudioApp.saveSettings(adminState.settings);
  renderProfessionalsEditor();
  renderSchedulesEditor();
}

function handleProfessionalsSubmit(e) {
  e.preventDefault();
  adminEls.professionalsEditor.querySelectorAll("[data-professional-field]").forEach((field) => {
    const professionalId = field.dataset.professionalId;
    const fieldName = field.dataset.professionalField;
    const professional = adminState.settings.professionals.find((p) => p.id === professionalId);
    if (professional) {
      if (fieldName === "rating") {
        professional[fieldName] = parseFloat(field.value) || 5.0;
      } else {
        professional[fieldName] = field.value;
      }
    }
  });
  StudioApp.saveSettings(adminState.settings);
  renderProfessionalsEditor();
}

function renderAdminAppointments() {
  if (!adminState.appointments.length) {
    adminEls.adminBookings.innerHTML = `<div class="empty-state">Sem agendamentos para gerenciar.</div>`;
    return;
  }

  const optionsStatus = ["pendente", "confirmado", "concluido", "cancelado"];
  const timeOptions = adminState.settings.slots.map((slot) => `<option value="${slot}">${slot}</option>`).join("");

  adminEls.adminBookings.innerHTML = [...adminState.appointments]
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .map((appointment) => {
      const service = StudioApp.findService(adminState.settings, appointment.serviceId);
      const professional = StudioApp.findProfessional(adminState.settings, appointment.professionalId);
      const paymentMethod = adminState.settings.paymentMethods.find((m) => m.id === appointment.paymentMethod);
      return `
        <article class="admin-booking-card">
          <div class="admin-booking-card__top">
            <div>
              <strong>${appointment.customer.name}</strong>
              <p>${service?.name || "-"} com ${professional?.name || "-"}</p>
              <p style="font-size: 0.85rem; color: var(--muted); margin-top: 5px;">Pagamento: ${paymentMethod?.name || "Nao informado"}</p>
            </div>
            <span class="status-badge status-${appointment.status}">${StudioApp.capitalize(appointment.status)}</span>
          </div>

          <div class="admin-booking-edit">
            <label class="field">
              <span>Data</span>
              <input type="date" value="${appointment.date}" data-admin-field="date" data-appointment-id="${appointment.id}">
            </label>
            <label class="field">
              <span>Horario</span>
              <select data-admin-field="time" data-appointment-id="${appointment.id}">
                ${timeOptions.replace(`value="${appointment.time}"`, `value="${appointment.time}" selected`)}
              </select>
            </label>
            <label class="field">
              <span>Status</span>
              <select data-admin-field="status" data-appointment-id="${appointment.id}">
                ${optionsStatus
                  .map((status) => `<option value="${status}" ${status === appointment.status ? "selected" : ""}>${StudioApp.capitalize(status)}</option>`)
                  .join("")}
              </select>
            </label>
            <label class="field">
              <span>Profissional</span>
              <select data-admin-field="professionalId" data-appointment-id="${appointment.id}">
                ${adminState.settings.professionals
                  .map((professional) => `<option value="${professional.id}" ${professional.id === appointment.professionalId ? "selected" : ""}>${professional.name}</option>`)
                  .join("")}
              </select>
            </label>
          </div>

          <div class="admin-booking-actions">
            <button class="ghost-btn" data-save-admin-booking="${appointment.id}">Salvar alteracoes</button>
            <button class="danger-btn" data-remove-admin-booking="${appointment.id}">Excluir</button>
          </div>
        </article>
      `;
    })
    .join("");

  adminEls.adminBookings.querySelectorAll("[data-save-admin-booking]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.saveAdminBooking;
      const updates = {};
      adminEls.adminBookings.querySelectorAll(`[data-appointment-id="${id}"]`).forEach((field) => {
        updates[field.dataset.adminField] = field.value;
      });
      saveAdminAppointment(id, updates);
    });
  });

  adminEls.adminBookings.querySelectorAll("[data-remove-admin-booking]").forEach((button) => {
    button.addEventListener("click", () => {
      adminState.appointments = adminState.appointments.filter((item) => item.id !== button.dataset.removeAdminBooking);
      StudioApp.saveAppointments(adminState.appointments);
      renderAdminAppointments();
    });
  });
}

function saveAdminAppointment(id, updates) {
  const current = adminState.appointments.find((item) => item.id === id);
  if (!current) {
    return;
  }

  const next = { ...current, ...updates };
  const conflict = adminState.appointments.some(
    (item) =>
      item.id !== id &&
      item.date === next.date &&
      item.time === next.time &&
      item.professionalId === next.professionalId &&
      item.status !== "cancelado" &&
      next.status !== "cancelado"
  );

  if (conflict) {
    alert("Ja existe outro agendamento nesse horario para esse profissional.");
    return;
  }

  adminState.appointments = adminState.appointments.map((item) => (item.id === id ? next : item));
  StudioApp.saveAppointments(adminState.appointments);
  renderAdminAppointments();
}

function handleThemeSubmit(event) {
  event.preventDefault();
  adminState.settings.theme.primary = adminEls.themePrimary.value;
  adminState.settings.theme.accent = adminEls.themeAccent.value;
  adminState.settings.theme.surface = adminEls.themeSurface.value;
  StudioApp.saveSettings(adminState.settings);
  StudioApp.applyTheme(adminState.settings);
}

function handleServicesSubmit(event) {
  event.preventDefault();
  adminState.settings.services = adminState.settings.services.map((service) => {
    const nameField = document.querySelector(`[data-service-field="name"][data-service-id="${service.id}"]`);
    const priceField = document.querySelector(`[data-service-field="price"][data-service-id="${service.id}"]`);
    const durationField = document.querySelector(`[data-service-field="duration"][data-service-id="${service.id}"]`);
    const popularField = document.querySelector(`[data-service-field="popular"][data-service-id="${service.id}"]`);
    return {
      ...service,
      name: nameField.value.trim() || service.name,
      price: Number(priceField.value) || service.price,
      duration: Number(durationField.value) || service.duration,
      popular: Boolean(popularField.checked)
    };
  });

  StudioApp.saveSettings(adminState.settings);
  renderAdminEditors();
}

function handleAddService() {
  const newService = {
    id: StudioApp.createId(),
    name: "Novo servico",
    price: 0,
    duration: 60,
    popular: false
  };
  adminState.settings.services.push(newService);
  StudioApp.saveSettings(adminState.settings);
  renderAdminEditors();
}

function renderProductsEditor() {
  adminEls.productsEditor.innerHTML = adminState.settings.products
    .map(
      (product) => `
        <div class="editable-row" style="grid-template-columns: 1.5fr 0.8fr 0.8fr 0.5fr;">
          <label class="field">
            <span>Produto</span>
            <input type="text" value="${product.name}" data-product-field="name" data-product-id="${product.id}">
          </label>
          <label class="field">
            <span>Categoria</span>
            <input type="text" value="${product.category}" data-product-field="category" data-product-id="${product.id}">
          </label>
          <label class="field">
            <span>Preco</span>
            <input type="number" min="0" step="0.01" value="${product.price}" data-product-field="price" data-product-id="${product.id}">
          </label>
          <label class="field popular-check">
            <span>X</span>
            <button type="button" class="danger-btn" data-remove-product="${product.id}" style="width: 100%; padding: 10px;">Excluir</button>
          </label>
        </div>
      `
    )
    .join("");
    
  adminEls.productsEditor.querySelectorAll("[data-remove-product]").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const productId = button.dataset.removeProduct;
      adminState.settings.products = adminState.settings.products.filter((p) => p.id !== productId);
      StudioApp.saveSettings(adminState.settings);
      renderProductsEditor();
    });
  });
}

function handleProductsSubmit(event) {
  event.preventDefault();
  adminState.settings.products = adminState.settings.products.map((product) => {
    const nameField = document.querySelector(`[data-product-field="name"][data-product-id="${product.id}"]`);
    const categoryField = document.querySelector(`[data-product-field="category"][data-product-id="${product.id}"]`);
    const priceField = document.querySelector(`[data-product-field="price"][data-product-id="${product.id}"]`);
    return {
      ...product,
      name: nameField.value.trim() || product.name,
      category: categoryField.value.trim() || product.category,
      price: Number(priceField.value) || product.price
    };
  });

  StudioApp.saveSettings(adminState.settings);
  renderProductsEditor();
}

function handleAddProduct() {
  const newProduct = {
    id: StudioApp.createId(),
    name: "Novo produto",
    price: 0,
    description: "",
    category: "Geral"
  };
  adminState.settings.products.push(newProduct);
  StudioApp.saveSettings(adminState.settings);
  renderProductsEditor();
}

function renderSchedulesEditor() {
  const weekdays = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
  let html = "";

  adminState.settings.professionals.forEach((professional) => {
    const schedule = adminState.settings.professionalSchedules[professional.id] || {};
    html += `
      <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid var(--line);">
        <h4 style="margin: 10px 0 15px; font-size: 1rem;">${professional.name}</h4>
        <div style="display: grid; gap: 10px;">
    `;
    
    weekdays.forEach((day, index) => {
      const value = schedule[index] || "09:00-18:00";
      html += `
        <label class="field" style="grid-template-columns: 1fr 1fr;">
          <span>${day}</span>
          <input type="text" value="${value}" placeholder="HH:MM-HH:MM ou FECHADO" data-schedule-field="time" data-professional-id="${professional.id}" data-day="${index}">
        </label>
      `;
    });
    
    html += `</div></div>`;
  });

  adminEls.schedulesEditor.innerHTML = html;
}

function handleSchedulesSubmit(event) {
  event.preventDefault();
  const scheduleInputs = adminEls.schedulesEditor.querySelectorAll("[data-schedule-field]");
  
  scheduleInputs.forEach((input) => {
    const professionalId = input.dataset.professionalId;
    const day = Number(input.dataset.day);
    const time = input.value.trim();
    
    if (!adminState.settings.professionalSchedules[professionalId]) {
      adminState.settings.professionalSchedules[professionalId] = {};
    }
    
    adminState.settings.professionalSchedules[professionalId][day] = time;
  });

  StudioApp.saveSettings(adminState.settings);
  renderSchedulesEditor();
  alert("Horarios salvos com sucesso!");
}

function renderAgendaCalendar() {
  adminEls.agendaMonthLabel.textContent = StudioApp.monthLabel(adminState.agendaCurrentMonth);
  
  // Render weekday headers
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  adminEls.agendaCalendarWeekdays.innerHTML = weekdays.map((day) => `<div class="weekday">${day}</div>`).join("");
  
  // Render calendar days
  const days = StudioApp.buildCalendarDays(adminState.agendaCurrentMonth);
  
  adminEls.agendaCalendarDays.innerHTML = days
    .map((day) => {
      const iso = StudioApp.toIsoDate(day.date);
      const otherMonth = day.date.getMonth() !== adminState.agendaCurrentMonth.getMonth();
      const stats = StudioApp.getDayStatsForAllProfessionals(adminState.appointments, adminState.settings, iso);
      const selected = adminState.agendaSelectedDate === iso;
      
      return `
        <button class="day-btn status-${otherMonth ? "outro" : stats.status} ${selected ? "selected" : ""}" 
                data-agenda-date="${iso}" 
                ${otherMonth ? "disabled" : ""}>
          <strong>${day.date.getDate()}</strong>
          <small>${otherMonth ? "" : stats.label}</small>
        </button>
      `;
    })
    .join("");
  
  adminEls.agendaCalendarDays.querySelectorAll("[data-agenda-date]").forEach((button) => {
    button.addEventListener("click", () => {
      adminState.agendaSelectedDate = button.dataset.agendaDate;
      renderAgendaCalendar();
      renderAgendaDay(adminState.agendaSelectedDate);
    });
  });
}

function renderAgendaDay(selectedDate) {
  if (!selectedDate) {
    adminEls.agendaDayView.innerHTML = "<p>Selecione uma data</p>";
    return;
  }

  const dayAppointments = adminState.appointments.filter((apt) => apt.date === selectedDate);
  
  if (!dayAppointments.length) {
    adminEls.agendaDayView.innerHTML = `<p style='color: var(--muted);'>Nao ha agendamentos em ${StudioApp.formatDate(selectedDate)}</p>`;
    return;
  }

  // Sort by time
  const sorted = [...dayAppointments].sort((a, b) => a.time.localeCompare(b.time));
  
  const html = sorted.map((apt) => {
    const service = StudioApp.findService(adminState.settings, apt.serviceId);
    const professional = StudioApp.findProfessional(adminState.settings, apt.professionalId);
    return `
      <div class="customer-card" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <strong style="font-size: 1.1rem;">${apt.time}</strong>
            <p>${apt.customer.name}</p>
            <p style="font-size: 0.9rem; color: var(--muted);">${service?.name || "-"} com ${professional?.name || "-"}</p>
            <p style="font-size: 0.9rem; color: var(--muted);">${apt.customer.phone}</p>
          </div>
          <span class="status-badge status-${apt.status}">${StudioApp.capitalize(apt.status)}</span>
        </div>
      </div>
    `;
  }).join("");

  adminEls.agendaDayView.innerHTML = `
    <div>
      <p style="color: var(--muted); font-size: 0.95rem; margin-bottom: 15px;"><strong>${StudioApp.formatDate(selectedDate)}</strong> - Total: <strong>${sorted.length}</strong> agendamento(s)</p>
      ${html}
    </div>
  `;
}

function renderSalesReport() {
  const monthValue = adminEls.monthPicker.value;
  if (!monthValue) {
    adminEls.salesReportView.innerHTML = "<p>Selecione um mes</p>";
    return;
  }

  const [year, month] = monthValue.split("-").map(Number);
  const stats = StudioApp.getMonthlyStats(month - 1, year);
  
  // Calcular serviços vendidos
  const servicesCount = {};
  stats.appointments.forEach((apt) => {
    const service = StudioApp.findService(adminState.settings, apt.serviceId);
    if (service) {
      servicesCount[service.name] = (servicesCount[service.name] || 0) + 1;
    }
  });
  
  const servicesHtml = Object.entries(servicesCount)
    .map(([name, count]) => `<li style="padding: 8px 0; border-bottom: 1px solid var(--line);"><strong>${name}:</strong> ${count}x</li>`)
    .join("");

  const html = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
      <div class="stat-card">
        <strong style="color: var(--success);">${StudioApp.currency(stats.totalRevenue)}</strong>
        <span>Receita total</span>
      </div>
      <div class="stat-card">
        <strong>${stats.totalAppointments}</strong>
        <span>Total de agendamentos</span>
      </div>
      <div class="stat-card">
        <strong style="color: var(--accent);">${stats.confirmedAppointments}</strong>
        <span>Confirmados</span>
      </div>
      <div class="stat-card">
        <strong style="color: var(--warning);">${stats.pendingAppointments}</strong>
        <span>Pendentes</span>
      </div>
      <div class="stat-card">
        <strong style="color: var(--danger);">${stats.cancelledAppointments}</strong>
        <span>Cancelados</span>
      </div>
      <div class="stat-card">
        <strong>${stats.completedAppointments}</strong>
        <span>Concluidos</span>
      </div>
    </div>
    
    <div style="padding: 15px; border-radius: var(--radius-md); background: rgba(255,255,255, 0.5); border: 1px solid var(--line); margin-bottom: 20px;">
      <h4 style="margin: 0 0 10px;">Resumo do mes de ${stats.month}</h4>
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li style="padding: 8px 0; border-bottom: 1px solid var(--line);">
          <strong>Receita Total:</strong> ${StudioApp.currency(stats.totalRevenue)}
        </li>
        <li style="padding: 8px 0;">
          <strong>Ticket medio:</strong> ${StudioApp.currency(stats.totalRevenue / Math.max(stats.confirmedAppointments, 1))}
        </li>
      </ul>
    </div>
    
    <div style="padding: 15px; border-radius: var(--radius-md); background: rgba(255,255,255, 0.5); border: 1px solid var(--line);">
      <h4 style="margin: 0 0 10px;">Servicos vendidos</h4>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${servicesHtml || "<li style=\"color: var(--muted);\">Nenhum serviço vendido neste mês</li>"}
      </ul>
    </div>
  `;

  adminEls.salesReportView.innerHTML = html;
  
  // Salvar relatório no Firebase com rolling window de 3 meses
  saveSalesReportToFirebase(year, month - 1, stats);
}

async function saveSalesReportToFirebase(year, month, stats) {
  try {
    const reportKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const reportData = {
      month: stats.month,
      year: year,
      monthNum: month + 1,
      totalRevenue: stats.totalRevenue,
      totalAppointments: stats.totalAppointments,
      confirmedAppointments: stats.confirmedAppointments,
      pendingAppointments: stats.pendingAppointments,
      cancelledAppointments: stats.cancelledAppointments,
      completedAppointments: stats.completedAppointments,
      timestamp: new Date().toISOString()
    };
    
    // Salvar no Firebase
    await writeToFirebase(`reports/${reportKey}`, reportData);
    
    // Implementar rolling window de 3 meses
    const allReports = await readFromFirebase("reports");
    if (allReports) {
      const reportsArray = Object.entries(allReports).map(([key, data]) => ({
        key,
        ...data
      }));
      
      // Ordenar por data
      reportsArray.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA;
      });
      
      // Manter apenas os últimos 3 meses
      const toDelete = reportsArray.slice(3);
      for (const report of toDelete) {
        await fetch(`https://barbeariarios-b7512-default-rtdb.firebaseio.com/reports/${report.key}.json`, {
          method: "DELETE"
        });
      }
    }
  } catch (error) {
    console.log("Relatório salvo localmente (offline)");
  }
}

async function downloadSalesReportPDF() {
  const monthValue = adminEls.monthPicker.value;
  if (!monthValue) {
    alert("Selecione um mês para baixar o relatório");
    return;
  }

  const [year, month] = monthValue.split("-").map(Number);
  const stats = StudioApp.getMonthlyStats(month - 1, year);
  
  // Calcular serviços vendidos
  const servicesCount = {};
  stats.appointments.forEach((apt) => {
    const service = StudioApp.findService(adminState.settings, apt.serviceId);
    if (service) {
      servicesCount[service.name] = (servicesCount[service.name] || 0) + 1;
    }
  });
  
  const servicesHtml = Object.entries(servicesCount)
    .map(([name, count]) => `<tr><td>${name}</td><td style="text-align: center;">${count}</td></tr>`)
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório de Vendas - ${stats.month}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #1e1e1e;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .stat-box {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #b77945;
          margin: 10px 0;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          font-size: 16px;
          margin: 0 0 15px;
          color: #1e1e1e;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #999;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Barbearia Rios</h1>
        <p>Relatório de Vendas - ${stats.month}</p>
        <p>Emitido em ${new Date().toLocaleDateString("pt-BR")}</p>
      </div>

      <div class="stats">
        <div class="stat-box">
          <div class="stat-label">Receita Total</div>
          <div class="stat-value">${StudioApp.currency(stats.totalRevenue)}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Agendamentos</div>
          <div class="stat-value">${stats.totalAppointments}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Ticket Médio</div>
          <div class="stat-value">${StudioApp.currency(stats.totalRevenue / Math.max(stats.confirmedAppointments, 1))}</div>
        </div>
      </div>

      <div class="section">
        <h2>Status dos Agendamentos</h2>
        <table>
          <tr>
            <th>Status</th>
            <th>Quantidade</th>
          </tr>
          <tr>
            <td>Confirmados</td>
            <td>${stats.confirmedAppointments}</td>
          </tr>
          <tr>
            <td>Pendentes</td>
            <td>${stats.pendingAppointments}</td>
          </tr>
          <tr>
            <td>Concluídos</td>
            <td>${stats.completedAppointments}</td>
          </tr>
          <tr>
            <td>Cancelados</td>
            <td>${stats.cancelledAppointments}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Serviços Vendidos</h2>
        <table>
          <tr>
            <th>Serviço</th>
            <th>Quantidade</th>
          </tr>
          ${servicesHtml || "<tr><td colspan=\"2\" style=\"text-align: center; color: #999;\">Nenhum serviço vendido neste mês</td></tr>"}
        </table>
      </div>

      <div class="footer">
        <p>Relatório gerado automaticamente pela Barbearia Rios</p>
        <p>Sistema de Agendamentos Online</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Nao foi possivel abrir a janela de impressao. Verifique se o navegador bloqueou o pop-up.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.addEventListener("load", () => {
    printWindow.focus();
    printWindow.print();
  });
}
