document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Função para exibir mensagem temporária
  function showTemporaryMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    
    // Limpa a mensagem após 5 segundos
    setTimeout(() => {
      messageDiv.textContent = "";
      messageDiv.className = "message";
    }, 5000);
  }

  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        await fetchActivities();
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Failed to unregister participant");
      }
    } catch (error) {
      console.error("Error unregistering participant:", error);
      showTemporaryMessage(`Error: ${error.message}`, "error");
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and existing activities
      activitiesList.innerHTML = "";
      
      // Clear existing activity options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p><strong>Current Participants:</strong></p>
            ${details.participants.length > 0 
              ? `<ul>
                  ${details.participants.map(email => `
                    <li>
                      ${email}
                      <button class="delete-participant" data-activity="${name}" data-email="${email}">×</button>
                    </li>`).join('')}
                </ul>`
              : '<p>No participants yet</p>'
            }
          </div>
        `;

        // Add click handlers for delete buttons
        const deleteButtons = activityCard.querySelectorAll('.delete-participant');
        deleteButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            const activity = e.target.dataset.activity;
            const email = e.target.dataset.email;
            unregisterParticipant(activity, email);
          });
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        showTemporaryMessage("Successfully signed up for activity!", "success");
        signupForm.reset();
        
        // Atualizar a lista de atividades após registro bem-sucedido
        await fetchActivities();
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Failed to sign up for activity");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      showTemporaryMessage(`Error: ${error.message}`, "error");
    }
  });

  // Initialize app
  fetchActivities();
});
