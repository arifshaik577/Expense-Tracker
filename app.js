// Default categories provided for all new student accounts
const DEFAULT_CATEGORIES = [
  "Food & Mess",
  "Travel & Commute",
  "Books & Stationery",
  "Rent & Utilities",
  "Personal Needs",
  "Pocket Money / Allowance",
  "Other"
];

// State Management
let currentUser = JSON.parse(localStorage.getItem("current_user")) || null;
let isRegisterMode = false;

// DOM Elements - Authentication
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authToggleLink = document.getElementById("auth-toggle-link");
const authToggleText = document.getElementById("auth-toggle-text");
const authPasswordInput = document.getElementById("auth-password");
const passwordHint = document.getElementById("password-hint");
const togglePasswordBtn = document.getElementById("toggle-password-btn");

// DOM Elements - Dashboard
const logoutBtn = document.getElementById("logout-btn");
const userDisplay = document.getElementById("user-display");
const budgetForm = document.getElementById("budget-form");
const budgetAmountInput = document.getElementById("budget-amount");
const transactionForm = document.getElementById("transaction-form");
const txDateInput = document.getElementById("tx-date");
const txCategorySelect = document.getElementById("tx-category");

const customCategoryForm = document.getElementById("custom-category-form");
const newCategoryInput = document.getElementById("new-category-input");
const categoryBadgeList = document.getElementById("category-badge-list");

const displayBudget = document.getElementById("display-budget");
const displaySpent = document.getElementById("display-spent");
const displayRemaining = document.getElementById("display-remaining");
const displayIncome = document.getElementById("display-income");
const budgetAlert = document.getElementById("budget-alert");
const categorySummaryList = document.getElementById("category-summary-list");
const transactionTableBody = document.getElementById("transaction-table-body");

// Initialize default date to today
txDateInput.value = new Date().toISOString().split("T")[0];

// Storage Helpers
function getUsers() {
  return JSON.parse(localStorage.getItem("users_db")) || {};
}

function saveUserData(userData) {
  const users = getUsers();
  users[userData.email] = userData;
  localStorage.setItem("users_db", JSON.stringify(users));
}

// Strong Password Validation
function validateStrongPassword(password) {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!minLength) return "Password must be at least 8 characters long.";
  if (!hasUpper) return "Password must include at least one uppercase letter (A-Z).";
  if (!hasLower) return "Password must include at least one lowercase letter (a-z).";
  if (!hasNumber) return "Password must include at least one number (0-9).";
  if (!hasSpecial) return "Password must include at least one special character (!@#$%^&* etc.).";

  return null;
}

// Show / Hide Password Toggle
togglePasswordBtn.addEventListener("click", () => {
  const isPassword = authPasswordInput.getAttribute("type") === "password";
  if (isPassword) {
    authPasswordInput.setAttribute("type", "text");
    togglePasswordBtn.textContent = "🙈";
  } else {
    authPasswordInput.setAttribute("type", "password");
    togglePasswordBtn.textContent = "👁";
  }
});

// Auth Toggle (Login vs Register)
authToggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  isRegisterMode = !isRegisterMode;
  authTitle.textContent = isRegisterMode ? "Create Student Account" : "Student Login";
  authSubmitBtn.textContent = isRegisterMode ? "Register" : "Login";
  authToggleText.textContent = isRegisterMode ? "Already registered?" : "Need an account?";
  authToggleLink.textContent = isRegisterMode ? "Login" : "Register";

  if (isRegisterMode) {
    passwordHint.classList.remove("hidden");
  } else {
    passwordHint.classList.add("hidden");
  }
});

// Auth Form Submission
authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("auth-email").value.trim().toLowerCase();
  const password = authPasswordInput.value;
  const users = getUsers();

  if (isRegisterMode) {
    const passwordError = validateStrongPassword(password);
    if (passwordError) {
      alert(`Weak Password:\n${passwordError}`);
      return;
    }

    if (users[email]) {
      alert("User already exists with this email. Please login.");
      return;
    }

    const newUser = {
      email,
      password,
      budget: 0,
      categories: [...DEFAULT_CATEGORIES],
      transactions: []
    };
    saveUserData(newUser);
    currentUser = newUser;
  } else {
    if (!users[email] || users[email].password !== password) {
      alert("Invalid credentials.");
      return;
    }
    currentUser = users[email];
    // Backwards compatibility for existing users without categories
    if (!currentUser.categories || currentUser.categories.length === 0) {
      currentUser.categories = [...DEFAULT_CATEGORIES];
      saveUserData(currentUser);
    }
  }

  localStorage.setItem("current_user", JSON.stringify(currentUser));
  initDashboard();
});

// Logout Handler
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("current_user");
  currentUser = null;
  authForm.reset();
  authPasswordInput.setAttribute("type", "password");
  togglePasswordBtn.textContent = "👁";
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
});

// Update Monthly Budget
budgetForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const budgetVal = parseFloat(budgetAmountInput.value);
  if (isNaN(budgetVal) || budgetVal <= 0) return;

  currentUser.budget = budgetVal;
  saveUserData(currentUser);
  localStorage.setItem("current_user", JSON.stringify(currentUser));
  budgetAmountInput.value = "";
  renderDashboard();
});

// Custom Category: Add New
customCategoryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newCat = newCategoryInput.value.trim();
  if (!newCat) return;

  if (!currentUser.categories) {
    currentUser.categories = [...DEFAULT_CATEGORIES];
  }

  // Prevent duplicate categories
  const exists = currentUser.categories.some(
    (c) => c.toLowerCase() === newCat.toLowerCase()
  );

  if (exists) {
    alert("This category already exists!");
    return;
  }

  currentUser.categories.push(newCat);
  saveUserData(currentUser);
  localStorage.setItem("current_user", JSON.stringify(currentUser));

  newCategoryInput.value = "";
  populateCategories();
  renderDashboard();
});

// Custom Category: Delete
function deleteCategory(catName) {
  if (currentUser.categories.length <= 1) {
    alert("You must keep at least one category.");
    return;
  }

  currentUser.categories = currentUser.categories.filter((c) => c !== catName);
  saveUserData(currentUser);
  localStorage.setItem("current_user", JSON.stringify(currentUser));

  populateCategories();
  renderDashboard();
}

// Populate Categories in Dropdown and Badges
function populateCategories() {
  const categories = currentUser.categories || DEFAULT_CATEGORIES;

  // Populate Dropdown
  txCategorySelect.innerHTML = "";
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    txCategorySelect.appendChild(opt);
  });

  // Populate Badge Manager
  categoryBadgeList.innerHTML = "";
  categories.forEach((cat) => {
    const badge = document.createElement("div");
    badge.className = "category-badge";
    badge.innerHTML = `
      <span>${cat}</span>
      <button type="button" class="badge-del-btn" title="Delete category" onclick="deleteCategory('${cat.replace(/'/g, "\\'")}')">×</button>
    `;
    categoryBadgeList.appendChild(badge);
  });
}

// Add Transaction (Income or Expense)
transactionForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const type = document.getElementById("tx-type").value;
  const amount = parseFloat(document.getElementById("tx-amount").value);
  const category = txCategorySelect.value;
  const date = document.getElementById("tx-date").value;
  const note = document.getElementById("tx-note").value.trim() || "-";

  if (isNaN(amount) || amount <= 0) return;

  const newTx = {
    id: Date.now(),
    type,
    amount,
    category,
    date,
    note
  };

  currentUser.transactions.unshift(newTx);
  saveUserData(currentUser);
  localStorage.setItem("current_user", JSON.stringify(currentUser));

  document.getElementById("tx-amount").value = "";
  document.getElementById("tx-note").value = "";
  renderDashboard();
});

// Delete Transaction
function deleteTransaction(id) {
  currentUser.transactions = currentUser.transactions.filter((tx) => tx.id !== id);
  saveUserData(currentUser);
  localStorage.setItem("current_user", JSON.stringify(currentUser));
  renderDashboard();
}

// Render Dashboard & Calculations
function renderDashboard() {
  const budget = currentUser.budget || 0;
  const transactions = currentUser.transactions || [];

  let totalExpense = 0;
  let totalIncome = 0;
  const categoryMap = {};

  transactions.forEach((tx) => {
    if (tx.type === "expense") {
      totalExpense += tx.amount;
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
    } else {
      totalIncome += tx.amount;
    }
  });

  const remaining = budget - totalExpense;

  // Render Metrics
  displayBudget.textContent = `₹${budget.toFixed(2)}`;
  displaySpent.textContent = `₹${totalExpense.toFixed(2)}`;
  displayRemaining.textContent = `₹${remaining.toFixed(2)}`;
  displayRemaining.className = remaining < 0 ? "expense-text" : "income-text";
  displayIncome.textContent = `₹${totalIncome.toFixed(2)}`;

  // 80% and 100% Alerts
  if (budget > 0) {
    const usagePercent = (totalExpense / budget) * 100;
    if (usagePercent >= 100) {
      budgetAlert.className = "alert-banner alert-danger";
      budgetAlert.textContent = `🚨 Budget Exceeded! You have spent ${usagePercent.toFixed(1)}% of your monthly allowance.`;
    } else if (usagePercent >= 80) {
      budgetAlert.className = "alert-banner alert-warning";
      budgetAlert.textContent = `⚠️ Caution: You have reached ${usagePercent.toFixed(1)}% of your monthly budget limit!`;
    } else {
      budgetAlert.className = "alert-banner hidden";
    }
  } else {
    budgetAlert.className = "alert-banner hidden";
  }

  // Render Category Breakdown
  categorySummaryList.innerHTML = "";
  const categoriesWithSpending = Object.keys(categoryMap);
  if (categoriesWithSpending.length === 0) {
    categorySummaryList.innerHTML = `<p class="empty-state">No expense records yet.</p>`;
  } else {
    categoriesWithSpending.forEach((cat) => {
      const amt = categoryMap[cat];
      const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(0) : 0;
      const row = document.createElement("div");
      row.className = "summary-item";
      row.innerHTML = `
        <span><strong>${cat}</strong> (${pct}%)</span>
        <span class="expense-text">₹${amt.toFixed(2)}</span>
      `;
      categorySummaryList.appendChild(row);
    });
  }

  // Render Transactions Table
  transactionTableBody.innerHTML = "";
  if (transactions.length === 0) {
    transactionTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No transactions recorded.</td></tr>`;
  } else {
    transactions.forEach((tx) => {
      const tr = document.createElement("tr");
      const isExp = tx.type === "expense";
      tr.innerHTML = `
        <td>${tx.date}</td>
        <td>${tx.category}</td>
        <td>${tx.note}</td>
        <td class="${isExp ? "expense-text" : "income-text"}">
          ${isExp ? "-" : "+"}₹${tx.amount.toFixed(2)}
        </td>
        <td>
          <button class="btn danger-sm" onclick="deleteTransaction(${tx.id})">✕</button>
        </td>
      `;
      transactionTableBody.appendChild(tr);
    });
  }
}

// Initialize View for Logged-In User
function initDashboard() {
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  userDisplay.textContent = currentUser.email.split("@")[0];
  populateCategories();
  renderDashboard();
}

// Initial Boot Check
if (currentUser) {
  initDashboard();
}

// Register Service Worker for Offline PWA Support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./" })
      .then((reg) => console.log("Service Worker registered:", reg.scope))
      .catch((err) => console.error("Service Worker failed:", err));
  });
}