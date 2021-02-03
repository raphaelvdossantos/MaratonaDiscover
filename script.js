const Modal = {
  open() {
    document
      .querySelector(".modal-overlay")
      .classList
      .add("active");
    document
      .querySelector(".error-box")
      .classList.remove('active');
  },
  close() {
    Form.clearFields();
    document
      .querySelector(".modal-overlay")
      .classList
      .remove("active");
  },
};

const Storage = {
  get(){
    return JSON
      .parse(localStorage
        .getItem("dev.finances:transactions")) || [];
  },
  set(transactions){
    localStorage
      .setItem("dev.finances:transactions", JSON.stringify(transactions));
  }
}

const Transaction = {
  all: Storage.get(),
  add(transaction){
    Transaction.all.push(transaction);
    App.reload();
  },
  remove(index){
    Transaction.all.splice(index, 1);
    App.reload();
  },
  incomes(){
    let income = 0;
    Transaction.all.forEach(element => element.amount > 0 ? income += element.amount : income);
    return income;
  },
  expenses(){
    let expense = 0;
    Transaction.all.forEach(element => element.amount < 0 ? expense += element.amount : expense);
    return expense;
  },
  total(){
    let total = 0;
    Transaction.all.forEach(element => element.amount ? total += element.amount : total);
    return Transaction.incomes() + Transaction.expenses();
  }
}

const DOM = {
  transactionContainer: document.querySelector('#data-table tbody'),
  addTransaction(transaction, index) {
    const tr = document.createElement('tr');
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);

    DOM.transactionContainer.appendChild(tr);
  },
  innerHTMLTransaction(transaction, index){
    const { description, amount, date } = transaction;

    const transactionType = amount > 0 ? 'income' : 'expense';
    const formattedAmount = Utils.formatCurrency(amount);

    const html = `
      <tr>
        <td class="description">${description}</td>
        <td class="${transactionType}">${formattedAmount}</td>
        <td class="date">${date}</td>
        <td>
          <img onclick="Transaction.remove(${index})"src="./assets/minus.svg" alt="Remover Transação" />
        </td>
      </tr>
      `;

    return html
  },
  updateBalance() {
    document
      .getElementById("incomeDisplay")
      .innerHTML = Utils.formatCurrency(Transaction.incomes());
    document
      .getElementById("expenseDisplay")
      .innerHTML = Utils.formatCurrency(Transaction.expenses());
    document
      .getElementById("totalDisplay")
      .innerHTML = Utils.formatCurrency(Transaction.total());
  },
  clearTransaction(){
    DOM.transactionContainer.innerHTML = "";
  }
}

const Utils = {
  formatAmount(value){
    return Number(value) * 100;
  },
  formatDate(date){
    const splittedDate = date.split("-")
    return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
  },
  formatCSV(data){
    
    const headers = Object.keys(data[0]);
    const formatedCSV = [headers]
     data.forEach(row => {
      let values = headers.map(header => {
          const escaped =  `${String(row[header]).replace(/"/g, '')}`
          return escaped
        })
      formatedCSV.push(values.join(','))
    });
    
    return formatedCSV.join('\n');
  },
  formatCurrency(value){
    const signal = Number(value) < 0? "- " : "";
    
    value = String(value).replace(/\D/g, "");
    value = Number(value)/100;
    value = value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    return signal + value;
  }
}

const Form = {
  description: document.querySelector('input#description'),
  amount: document.querySelector('input#amount'),
  date: document.querySelector('input#date'),
  handleBlankFields(error){
    const errorBox = document.querySelector(".error-box")
    errorBox.classList.add('active');
    errorBox.innerText = error.message;
  },
  getValues(){
    return {
      description: Form.description.value,
      amount: Form.amount.value,
      date: Form.date.value
    }
  },
  validateFields(){
    const {description, amount, date} = Form.getValues();
    if(description.trim() === "" || amount.trim() === "" || date.trim() === ""){
      throw new Error("Por favor, preencha todos os campos!")
    }
  },
  formatData(){
    let {description, amount, date} = Form.getValues();
    amount = Utils.formatAmount(amount);
    date = Utils.formatDate(date);

    return{
      description,
      amount,
      date
    }
  },
  clearFields(){
    Form.description.value = "";
    Form.amount.value = "";
    Form.date.value = "";
  },
  submit(event){
    event.preventDefault();
    

    try{
      Form.validateFields();
      const transaction = Form.formatData();

      Transaction.add(transaction);
      Form.clearFields();
      Modal.close();

    } catch(error){
      Form.handleBlankFields(error);
    }
  }
}

const Export = {
  toCSV(){     
    const csvToExport = Utils.formatCSV(Storage.get());
    const blob = new Blob([csvToExport], {type: 'text/csv'});
    const url = window.URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('hidden', '');
    downloadLink.setAttribute('href', url);
    downloadLink.setAttribute('download', 'finance.csv');
    document.body.appendChild(downloadLink);
    downloadLink.click()
    document.body.removeChild(downloadLink);
  }
}

const Mode = {
  screen: document.documentElement,
  alternate(){
    const toggleControl = document.querySelector('#switch');   
    Mode.transition();
    toggleControl.checked ? 
      Mode.screen.setAttribute('data-theme', 'dark') : 
      Mode.screen.setAttribute('data-theme', 'light');
     
  },
  transition(){
    Mode.screen.classList.add('transition');
    window.setTimeout(() => {
      Mode.screen.classList.remove('transition');
    }, 3000);
  }
}

const App = {
  init(){
    Transaction.all.forEach(DOM.addTransaction);
    DOM.updateBalance();  
    Storage.set(Transaction.all);
  },
  reload(){
    DOM.clearTransaction();
    App.init();
  }
}



App.init()