const Modal = {
  isEdit: false,
  open() {
    Modal.isEdit = false;
    document.querySelector("#form h2").innerText = "Nova Transação";
    document.querySelector(".modal-overlay").classList.add("active");
    document.querySelector(".error-box").classList.remove("active");
    document.querySelector("#form").classList.remove("hide");
    document.querySelector(".downloadbox").classList.add("hide");
  },
  close() {
    Form.clearFields();
    document.querySelector(".modal-overlay").classList.remove("active");
  },
  openEdit() {
    document.querySelector(".modal-overlay").classList.add("active");
    document.querySelector("#form h2").innerText = "Editar Transação";
    document.querySelector(".error-box").classList.remove("active");
    document.querySelector("#form").classList.remove("hide");
    document.querySelector(".downloadbox").classList.add("hide");
  },
};

const Storage = {
  get() {
    return JSON.parse(localStorage.getItem("dev.finances:transactions")) || [];
  },
  set(transactions) {
    localStorage.setItem(
      "dev.finances:transactions",
      JSON.stringify(transactions)
    );
  },
  getMode() {
    return JSON.parse(localStorage.getItem("Mode:modeTheme")) || [];
  },
  setMode(theme) {
    localStorage.setItem("Mode:modeTheme", JSON.stringify(theme));
  },
};

const Transaction = {
  all: Storage.get(),
  underEditionIndex: null,
  add(transaction) {
    Transaction.all.push(transaction);
    App.reload();
  },
  saveEdit(transaction, index) {
    Transaction.all[index] = transaction;
    App.reload();
  },
  remove(index) {
    Transaction.all.splice(index, 1);
    App.reload();
  },
  incomes() {
    let income = 0;
    Transaction.all.forEach((element) =>
      element.amount > 0 ? (income += element.amount) : income
    );
    return income;
  },
  expenses() {
    let expense = 0;
    Transaction.all.forEach((element) =>
      element.amount < 0 ? (expense += element.amount) : expense
    );
    return expense;
  },
  total() {
    let total = 0;
    Transaction.all.forEach((element) =>
      element.amount ? (total += element.amount) : total
    );
    return Transaction.incomes() + Transaction.expenses();
  },
};

const PanelControl = {
  changePanel() {
    const calculatorPanel = document.querySelector("#calculator");
    const chartPanel = document.querySelector(".chart-page");
    calculatorPanel.classList.toggle("hide");
    chartPanel.classList.toggle("hide");
  },
};

const DOM = {
  transactionContainer: document.querySelector("#data-table tbody"),
  addTransaction(transaction, index) {
    const tr = document.createElement("tr");
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
    tr.dataset.index = index;

    DOM.transactionContainer.appendChild(tr);
  },
  innerHTMLTransaction(transaction, index) {
    const { description, amount, date } = transaction;

    const transactionType = amount > 0 ? "income" : "expense";
    const formattedAmount = Utils.formatCurrency(amount);

    const html = `
      <tr>
        <td class="description" onclick="DOM.editTransaction(${index})">${description}</td>
        <td class="${transactionType}">${formattedAmount}</td>
        <td class="date">${date}</td>
        <td>
          <img onclick="Transaction.remove(${index})"src="./assets/minus.svg" alt="Remover Transação" />
        </td>
      </tr>
      `;

    return html;
  },
  editTransaction(index) {
    Modal.isEdit = true;
    Modal.openEdit();
    document.querySelector("input#description").value =
      Transaction.all[index].description;
    document.querySelector("input#amount").value =
      Transaction.all[index].amount / 100;
    document.querySelector("input#date").value = Utils.reformatDate(
      Transaction.all[index].date
    );

    Transaction.underEditionIndex = index;
  },
  updateBalance() {
    document.getElementById("incomeDisplay").innerHTML = Utils.formatCurrency(
      Transaction.incomes()
    );
    document.getElementById("expenseDisplay").innerHTML = Utils.formatCurrency(
      Transaction.expenses()
    );
    document.getElementById("totalDisplay").innerHTML = Utils.formatCurrency(
      Transaction.total()
    );
  },
  clearTransaction() {
    DOM.transactionContainer.innerHTML = "";
  },
};

const Utils = {
  formatAmount(value) {
    value = value * 100;
    return Math.round(value);
  },
  formatDate(date) {
    const splittedDate = date.split("-");
    return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`;
  },
  reformatDate(date) {
    const splittedDate = date.split("/");
    return `${splittedDate[2]}-${splittedDate[1]}-${splittedDate[0]}`;
  },
  formatCSV(data) {
    const headers = Object.keys(data[0]);
    const formatedCSV = [headers];
    data.forEach((row) => {
      let values = headers.map((header) => {
        const escaped = `${String(row[header]).replace(/"/g, "")}`;
        return escaped;
      });
      formatedCSV.push(values.join(","));
    });

    return formatedCSV.join("\n");
  },
  formatCurrency(value) {
    const signal = Number(value) < 0 ? "- " : "";

    value = String(value).replace(/\D/g, "");
    value = Number(value) / 100;
    value = value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return signal + value;
  },
  formatData(value) {
    value = Number(value) / 100;
    return value;
  },
};

const Form = {
  description: document.querySelector("input#description"),
  amount: document.querySelector("input#amount"),
  date: document.querySelector("input#date"),
  handleBlankFields(error) {
    const errorBox = document.querySelector(".error-box");
    errorBox.classList.add("active");
    errorBox.innerText = error.message;
  },
  getValues() {
    return {
      description: Form.description.value,
      amount: Form.amount.value,
      date: Form.date.value,
    };
  },
  validateFields() {
    const { description, amount, date } = Form.getValues();
    if (
      description.trim() === "" ||
      amount.trim() === "" ||
      date.trim() === ""
    ) {
      throw new Error("Por favor, preencha todos os campos!");
    }
  },
  formatData() {
    let { description, amount, date } = Form.getValues();
    amount = Utils.formatAmount(amount);
    date = Utils.formatDate(date);

    return {
      description,
      amount,
      date,
    };
  },
  clearFields() {
    Form.description.value = "";
    Form.amount.value = "";
    Form.date.value = "";
  },
  submit(event) {
    event.preventDefault();

    try {
      Form.validateFields();
      const transaction = Form.formatData();

      Modal.isEdit
        ? Transaction.saveEdit(transaction, Transaction.underEditionIndex)
        : Transaction.add(transaction);

      Form.clearFields();
      Modal.close();
    } catch (error) {
      Form.handleBlankFields(error);
    }
  },
};

const Graph = {
  hook: document.getElementById("chart").getContext("2d"),
  constructor: {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Balance",
          data: [],
          backgroundColor: [],
        },
      ],
    },
    options: {
      scales: {
        xAxes: [
          {
            gridLines: {
              display: false,
            },
          },
        ],
        yAxes: [
          {
            gridLines: {
              display: false,
            },
          },
        ],
      },
    },
  },
  getLabels() {
    const list = [];
    Storage.get().forEach((element) => {
      list.push(element.description);
    });
    App.chart.data.labels = list;
  },
  getData() {
    const data = [];
    Storage.get().forEach((element) => {
      data.push(Utils.formatData(element.amount));
    });
    App.chart.data.datasets[0].data = data;
  },
  getColors() {
    const colors = [];
    Storage.get().forEach((element) => {
      colors.push(element.amount > 0 ? "#12A454" : "#e92929");
    });
    App.chart.data.datasets[0].backgroundColor = colors;
  },
  updateData() {
    Graph.getLabels();
    Graph.getData();
    Graph.getColors();
    App.chart.update();
  },
};

const Export = {
  downloadCSV() {
    const csvToExport = Utils.formatCSV(Storage.get());
    const blob = new Blob([csvToExport], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("hidden", "");
    downloadLink.setAttribute("href", url);
    downloadLink.setAttribute("download", "finance.csv");
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    document.querySelector("#form").classList.toggle("hide");
    Modal.close();
  },
  openLinkModal() {
    document.querySelector(".modal-overlay").classList.add("active");
    document.querySelector("#form").classList.add("hide");
    document.querySelector(".downloadbox").classList.remove("hide");
  },
};

const Mode = {
  screen: document.documentElement,
  alternate() {
    const toggleControl = document.querySelector("#switch");
    Mode.transition();
    toggleControl.checked
      ? Mode.screen.setAttribute("data-theme", "dark")
      : Mode.screen.setAttribute("data-theme", "light");

    Mode.saveMode();
  },
  transition() {
    Mode.screen.classList.add("transition");
    window.setTimeout(() => {
      Mode.screen.classList.remove("transition");
    }, 3000);
  },
  onWakeMode() {
    const currentMode = Storage.getMode();
    const toggleControl = document.querySelector("#switch");

    toggleControl.defaultChecked = currentMode == "dark";

    if (currentMode == "dark") {
      Mode.screen.setAttribute("data-theme", "dark");
    }
  },
  saveMode() {
    const currentMode = Mode.screen.getAttribute("data-theme");
    Storage.setMode(currentMode);
  },
};

const App = {
  chart: null,
  isFirstInitializaiton: true,
  init() {
    Mode.onWakeMode();
    Transaction.all.forEach(DOM.addTransaction);
    DOM.updateBalance();
    Storage.set(Transaction.all);
    if (App.isFirstInitializaiton) {
      App.chart = new Chart(Graph.hook, Graph.constructor);
    }
    Graph.updateData();
  },
  reload() {
    App.isFirstInitializaiton = false;
    DOM.clearTransaction();
    App.init();
  },
};

App.init();
