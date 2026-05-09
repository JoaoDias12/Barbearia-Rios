// Configuração do Firebase para Barbearia Rios
const firebaseConfig = {
  databaseURL: "https://barbeariarios-b7512-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase (será usado com Realtime Database)
let database = null;

function initializeFirebase() {
  // Usar fetch para testar conexão com banco de dados
  fetch(firebaseConfig.databaseURL + ".json")
    .then(response => {
      if (response.ok) {
        console.log("✓ Conectado ao Firebase Realtime Database");
        database = firebaseConfig.databaseURL;
      } else {
        console.log("⚠ Banco de dados está configurado, mas com restrições de segurança");
        database = firebaseConfig.databaseURL;
      }
    })
    .catch(error => {
      console.log("⚠ Firebase configurado para sincronização futura");
      database = firebaseConfig.databaseURL;
    });
}

// Funções auxiliares para Firebase
async function readFromFirebase(path) {
  try {
    const response = await fetch(`${firebaseConfig.databaseURL}${path}.json`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Erro ao ler do Firebase:", error);
    return null;
  }
}

async function writeToFirebase(path, data) {
  try {
    const response = await fetch(`${firebaseConfig.databaseURL}${path}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Erro ao escrever no Firebase:", error);
    return null;
  }
}

async function updateInFirebase(path, data) {
  try {
    const response = await fetch(`${firebaseConfig.databaseURL}${path}.json`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Erro ao atualizar no Firebase:", error);
    return null;
  }
}

// Inicializar quando carregado
document.addEventListener("DOMContentLoaded", initializeFirebase);
