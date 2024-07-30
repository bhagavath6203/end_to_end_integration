function handleAddUser() {
    fetch("/customer/fetch_customers")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        const totalCustomers = data.length;
        document.getElementById("customerId").value = totalCustomers + 1;
        document.getElementById("addUserModal").style.display = "flex";
      })
      .catch((error) => console.error("Error fetching customers:", error));
  }
  
  function closeModal() {
    document.getElementById("addUserModal").style.display = "none";
  }
  
  window.onclick = function (event) {
    const modal = document.getElementById("addUserModal");
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
  
  // Fetch customers and populate the table
  function fetchCustomers() {
    fetch("/customer/fetch_customers")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        const tbody = document.getElementById("customer-tbody");
        tbody.innerHTML = "";
        data.forEach((customer) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                      <td>${customer.customer_id}</td>  <!-- Display customer_id instead of _id -->
                      <td>${customer.customer_name}</td>
                      <td>${customer.email}</td>
                      <td>${customer.contact_number}</td>
                      <td>${customer.status}</td>
                      <td>
                          <button class="view-tickets-btn">View Tickets</button>
                          <button class="edit-button" onclick="handleEdit('${customer._id}', this)">Edit</button>
  
                          <button class="delete-button" style="background-color: #DB7093; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;" onclick="handleDelete('${customer._id}', this)">Delete</button>
                         
                      </td>
                  `;
          tbody.appendChild(row);
        });
      })
      .catch((error) => console.error("Error fetching customers:", error));
  }
  
  // Add a new user
  function addUser() {
    const form = document.getElementById("addUserForm");
    const formData = new FormData(form);
  
    const customerName = formData.get("customerName");
    const email = formData.get("email");
    const contactNumber = formData.get("contactNumber");
  
    // Basic validation
    if (!customerName || !email || !contactNumber) {
      document.getElementById("error-message").textContent = "Please fill out all fields.";
      document.getElementById("error-popup").style.display = "block";
      return;
    }
  
    // Email validation
    if (!/\S+@gmail\.com/.test(email)) {
      document.getElementById("error-message").textContent = "Please include @gmail.com in the email field.";
      document.getElementById("error-popup").style.display = "block";
      return;
    }
  
    // Contact number validation
    if (!/^\d{10}$/.test(contactNumber)) {
      document.getElementById("error-message").textContent = "Please enter a valid 10-digit contact number.";
      document.getElementById("error-popup").style.display = "block";
      return;
    }
  
    // Check for duplicate user details
    fetch("/customer/fetch_customers")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((customers) => {
        const duplicate = customers.some(
          (customer) =>
            customer.customer_name === customerName ||
            customer.email === email ||
            customer.contact_number === contactNumber
        );
        if (duplicate) {
          document.getElementById("error-message").textContent = "User with the same details already exists.";
          document.getElementById("error-popup").style.display = "block";
          return;
        }
  
        // Add user if no duplicates
        fetch("/customer/add_user", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to add user");
            }
            return response.json();
          })
          .then((data) => {
            if (data.message) {
              document.getElementById("successMessage").textContent = data.message;
              document.getElementById("successModal").style.display = "block";
              fetchCustomers();
              closeModal();
            }
          })
          .catch((error) => {
            console.error("Error adding user:", error);
            document.getElementById("error-message").textContent = "Failed to add user. Please try again.";
            document.getElementById("error-popup").style.display = "block";
          });
      })
      .catch((error) => {
        console.error("Error checking duplicates:", error);
        document.getElementById("error-message").textContent = "Failed to check duplicates. Please try again.";
        document.getElementById("error-popup").style.display = "block";
      });
  }
  
  
  function closePopup() {
    document.getElementById("error-popup").style.display = "none";
  }
  
  
  // Get the modal
  var successModal = document.getElementById("successModal");
  document.querySelector(".close").addEventListener("click", function () {
    successModal.style.display = "none";
  });
  
  // When the user clicks anywhere outside of the modal, close it
  window.addEventListener("click", function (event) {
    if (event.target == successModal) {
      successModal.style.display = "none";
    }
  });
  
  // Delete a user
  let userIdToDelete;
  let deleteButton;
  
  function handleDelete(userId, button) {
    userIdToDelete = userId;
    deleteButton = button;
    document.getElementById("deleteConfirmationModal").style.display = "block";
  }
  
  function closeDeleteModal() {
    document.getElementById("deleteConfirmationModal").style.display = "none";
  }
  
  function confirmDelete() {
    fetch(`/customer/delete_user/${userIdToDelete}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data.message) {
          document.getElementById("successMessage").textContent = data.message;
          document.getElementById("successModal").style.display = "block";
          const row = deleteButton.closest("tr");
          row.remove();
        } else if (data.error) {
          alert(data.error);
        }
      })
      .catch((error) => {
        console.error("Error deleting user:", error);
        alert("Failed to delete user. Please try again.");
      });
    closeDeleteModal();
  }
  
  // Filter tickets by status
  function filterTickets() {
    const filterValue = document.getElementById("ticketStatusFilter").value;
    const filteredCustomers = allCustomers.filter(customer => {
      return filterValue === "All" || customer.status === filterValue;
    });
  
    currentPage = 1;
    totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
    totalPagesSpan.textContent = totalPages;
    displayCustomers(filteredCustomers, currentPage);
  }
  
  // Search functionality including Active Tickets column
  document.getElementById("search").addEventListener("keyup", handleSearch);
  
  function handleSearch() {
    var input, filter, table, tbody, tr, td, i, txtValue;
    input = document.getElementById("search");
    filter = input.value.toUpperCase();
    tbody = document.getElementById("customer-tbody");
    tr = tbody.getElementsByTagName("tr");
  
   // Filter allCustomers array based on the search input
   filteredCustomers = allCustomers.filter(customer => {
    return Object.values(customer)
      .some(value => value.toString().toUpperCase().indexOf(filter) > -1);
  });
  
  // Update the current page to 1
  currentPage = 1;
  
  // Update the totalPages based on the filtered customers
  totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  totalPagesSpan.textContent = totalPages;
  
  // Display the filtered customers for the current page
  displayCustomers(filteredCustomers, currentPage);
  
    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td");
      let showRow = false;
      for (let j = 0; j < td.length; j++) {
        if (td[j]) {
          txtValue = td[j].textContent || td[j].innerText;
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
            showRow = true;
            break;
          }
        }
      }
  
      let activeTickets = td[4].textContent.toUpperCase();
      if (activeTickets.indexOf(filter) > -1) {
        showRow = true;
      }
  
      tr[i].style.display = showRow ? "" : "none";
    }
  }
  
  document.addEventListener("DOMContentLoaded", function () {
    // Hide the modal initially
    document.getElementById("addUserModal").style.display = "none";
  
    // Initial fetch of customers when page loads
    fetchCustomers();
  });
  
  
  // Get a reference to the export button
  const exportBtn = document.getElementById("export-btn");
  exportBtn.addEventListener("click", function () {
    const exportTable = document.createElement("table");
    const exportThead = document.createElement("thead");
    const exportTbody = document.createElement("tbody");
  
    // Create table heading row
    const headingRow = document.createElement("tr");
    headingRow.innerHTML = `
      <th>Customer ID</th>
      <th>Customer Name</th>
      <th>Email</th>
      <th>Contact Number</th>
      <th>Status</th>
    `;
    exportThead.appendChild(headingRow);
  
    // Populate the export table with all customers
    allCustomers.forEach((customer) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${customer.customer_id}</td>
        <td>${customer.customer_name}</td>
        <td>${customer.email}</td>
        <td>${customer.contact_number}</td>
        <td>${customer.status}</td>
      `;
      exportTbody.appendChild(row);
    });
  
    exportTable.appendChild(exportThead);
    exportTable.appendChild(exportTbody);
  
    const workbook = XLSX.utils.table_to_book(exportTable);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
    // Set column widths
    const colWidths = [];
    for (let i = 0; i < XLSX.utils.decode_range(worksheet['!ref']).e.c + 1; i++) {
      let colWidth = 10;
      if (i === 0 || i === 1 || i === 2) {
        colWidth = 30;
        console.log(`Column ${i} width set to ${colWidth}`);
      }
  
      colWidths.push({wch: colWidth});
    }
    worksheet['!cols'] = colWidths;
  
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(data);
    downloadLink.download = "data.xlsx";
    downloadLink.click();
  });
  
  const customersPerPage = 6;
  let currentPage = 1;
  let totalPages = 0;
  
  // Get a reference to the pagination elements
  const prevButton = document.getElementById("prev-button");
  const nextButton = document.getElementById("next-button");
  const currentPageSpan = document.getElementById("current-page");
  const totalPagesSpan = document.getElementById("total-pages");
  
  
  
  // Display a page of customers
  function displayCustomers(customers, page) {
    const startIndex = (page - 1) * customersPerPage;
    const endIndex = startIndex + customersPerPage;
    const pageCustomers = customers.slice(startIndex, endIndex);
  
    const tbody = document.getElementById("customer-tbody");
    tbody.innerHTML = "";
  
    pageCustomers.forEach((customer) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${customer.customer_id}</td>
        <td>${customer.customer_name}</td>
        <td>${customer.email}</td>
        <td>${customer.contact_number}</td>
        <td class="status-column ${customer.status.toLowerCase()}">${customer.status}</td>
        <td>
          <button class="view-tickets-btn">View Tickets</button>
          <button class="delete-button" onclick="handleDelete('${customer._id}', this)">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
  
  // Handle previous button click
  prevButton.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      currentPageSpan.textContent = currentPage;
      fetchCustomers();
    }
  });
  
  // Handle next button click
  nextButton.addEventListener("click", function () {
    if (currentPage < totalPages) {
      currentPage++;
      currentPageSpan.textContent = currentPage;
      fetchCustomers();
    }
  });
  
  // Fetch customers when the page loads
  fetchCustomers();
  
  
  
  /* to store all the different pages users in one file */
  let allCustomers = [];
  function fetchCustomers() {
    fetch("/customer/fetch_customers")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        allCustomers = data;
  
        // Calculate the total number of pages
        totalPages = Math.ceil(data.length / customersPerPage);
  
        // Update the totalPagesSpan with the total number of pages
        totalPagesSpan.textContent = totalPages;
  
        displayCustomers(data, currentPage);
      })
      .catch((error) => console.error("Error fetching customers:", error));
  }
  
  
  /* random colors */
  const hue = Math.floor(Math.random() * 360);
  document.documentElement.style.setProperty(`--h`, hue);
  
  // add profile picture and remove picture 
  function loadFile(event) {
    var image = document.getElementById("output");
    image.src = URL.createObjectURL(event.target.files[0]);
    image.style.display = "block";
    document.getElementById("avatar").style.display = "none";
    document.getElementById("remove-image").style.display = "block";
    localStorage.setItem("profilePicture", image.src);
  }
  
  function removeImage() {
    document.getElementById("output").style.display = "none";
    document.getElementById("avatar").style.display = "block";
    document.getElementById("remove-image").style.display = "none";
    localStorage.removeItem("profilePicture");
  }
  
  window.onload = function() {
    var storedImage = localStorage.getItem("profilePicture");
    if (storedImage) {
      document.getElementById("output").src = storedImage;
      document.getElementById("output").style.display = "block";
      document.getElementById("avatar").style.display = "none";
      document.getElementById("remove-image").style.display = "block";
    }
  };
  
  const importBtn = document.getElementById("import-btn");
  const importFile = document.getElementById("import-file");
  
  
  importBtn.addEventListener("click", function () {
    importFile.click();
  });
  
  importFile.addEventListener("change", handleImport);
  
  
  function importData() {
    const file = importFile.files[0];
    const reader = new FileReader();
  
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[worksheet.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
      if (jsonData.length > 0 && jsonData[0].hasOwnProperty("customer_id") && jsonData[0].hasOwnProperty("customer_name") && jsonData[0].hasOwnProperty("email") && jsonData[0].hasOwnProperty("contact_number") && jsonData[0].hasOwnProperty("status")) {
  
        fetch("/customer/import_data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jsonData),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to import data");
            }
            return response.json();
          })
          .then((data) => {
            if (data.message) {
              document.getElementById("successMessage").textContent = data.message;
              document.getElementById("successModal").style.display = "block";
              fetchCustomers();
            }
          })
          .catch((error) => {
            console.error("Error importing data:", error);
            document.getElementById("error-message").textContent = "Failed to import data. Please try again.";
            document.getElementById("error-popup").style.display = "block";
          });
      } else {
        document.getElementById("error-message").textContent = "Incorrect data structure. Please use the correct template.";
        document.getElementById("error-popup").style.display = "block";
      }
    };
  
    reader.readAsArrayBuffer(file);
  }
  
  importFile.addEventListener("change", handleImport);
  
  
  function handleImport() {
    console.log("Importing data...");
    const file = importFile.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
  
      const mappedData = data.map(item => {
        return {
          customer_id: item['Customer ID'] || null,
          customer_name: item['Customer Name'] || null,
          email: item['Email ID'] || null,
          contact_number: item['Contact Number'] || null,
          status: item['Active Tickets'] || null
        };
      });
  
      // Filtering duplicates based on customer_id
      const uniqueData = mappedData.filter((value, index, self) =>
        index === self.findIndex((t) => (
          t.customer_id === value.customer_id
        ))
      );
  
      fetch("/customer/import_data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(uniqueData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to import data");
        }
        return response.json();
      })
      .then(data => {
        console.log("Data imported successfully:", data);
        fetchCustomers();
      })
      .catch(error => {
        console.error("Error importing data:", error);
      });
    };
  
    reader.readAsBinaryString(file);
  }
  
  const mappedData = data.map(item => {
    return {
      customer_id: item['Customer ID'] || null,
      customer_name: item['Customer Name'] || null,
      email: item['Email ID'] || null,
      contact_number: item['Contact Number'] || null,
      status: item['Active Tickets'] || null
    };
  });