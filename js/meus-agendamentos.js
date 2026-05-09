const myBookingsState = {
  settings: StudioApp.getSettings(),
  appointments: StudioApp.getAppointments()
};

StudioApp.initSecretAdminTrigger();
void initMyBookingsPage();
bindMyBookingsEvents();

async function initMyBookingsPage() {
  myBookingsState.settings = await StudioApp.loadSettingsFromDatabase();
  StudioApp.applyTheme(myBookingsState.settings);
  myBookingsState.appointments = await StudioApp.loadAppointmentsFromDatabase();
  renderMyBookingsPage();
}

function bindMyBookingsEvents() {
  document.getElementById("clearCompletedBtn").addEventListener("click", () => {
    myBookingsState.appointments = myBookingsState.appointments.filter((item) => !["cancelado", "concluido"].includes(item.status));
    StudioApp.saveAppointments(myBookingsState.appointments);
    renderMyBookingsPage();
  });
}

function renderMyBookingsPage() {
  document.getElementById("footerNow").textContent = `Atualizado em ${StudioApp.formatDateTime(new Date())}`;
  const list = document.getElementById("appointmentsList");

  if (!myBookingsState.appointments.length) {
    list.innerHTML = `<div class="empty-state">Nenhum agendamento salvo ainda.</div>`;
    return;
  }

  list.innerHTML = [...myBookingsState.appointments]
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .map((appointment) => {
      const service = StudioApp.findService(myBookingsState.settings, appointment.serviceId);
      const professional = StudioApp.findProfessional(myBookingsState.settings, appointment.professionalId);
      const paymentMethod = myBookingsState.settings.paymentMethods.find((m) => m.id === appointment.paymentMethod);
      return `
        <article class="customer-card">
          <div class="customer-panel__header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="selection-icon">${service?.icon || "BR"}</span>
              <div>
                <strong>${appointment.customer.name}</strong>
                <p>${service?.name || "-"} com ${professional?.name || "-"}</p>
              </div>
            </div>
            <span class="status-badge status-${appointment.status}">${StudioApp.capitalize(appointment.status)}</span>
          </div>
          <div class="customer-card__meta">
            <div class="booking-meta">
              <span>Data</span>
              <strong>${StudioApp.formatDate(appointment.date)}</strong>
            </div>
            <div class="booking-meta">
              <span>Horario</span>
              <strong>${appointment.time}</strong>
            </div>
            <div class="booking-meta">
              <span>Contato</span>
              <strong>${appointment.customer.phone}</strong>
            </div>
            <div class="booking-meta">
              <span>Pagamento</span>
              <strong>${paymentMethod?.name || "Nao informado"}</strong>
            </div>
          </div>
          <div class="customer-actions">
            ${appointment.status !== "cancelado" && appointment.status !== "concluido"
              ? `<button class="danger-btn" data-cancel-booking="${appointment.id}">Cancelar</button>`
              : ""}
          </div>
        </article>
      `;
    })
    .join("");

  list.querySelectorAll("[data-cancel-booking]").forEach((button) => {
    button.addEventListener("click", () => {
      myBookingsState.appointments = myBookingsState.appointments.map((item) =>
        item.id === button.dataset.cancelBooking ? { ...item, status: "cancelado" } : item
      );
      StudioApp.saveAppointments(myBookingsState.appointments);
      renderMyBookingsPage();
    });
  });
}
