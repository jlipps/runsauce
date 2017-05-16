const _ = require('lodash');

const colors = {
  lightGreen: '74c275',
  darkGreen: '2a4a3b',
  lightRed: 'cd8585',
  darkRed: '822323',
  lightOrange: 'e5ae4e',
  lighterOrange: 'f5ce8e',
  darkOrange: '582d11'
};

_.encodeUnicode = function (rawStr) {
  if (rawStr.indexOf("<table") !== -1) {
    return rawStr;
  }
  return rawStr.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
   return '&#'+i.charCodeAt(0)+';';
  });
};

const htmlTemplate = _.template(`
    <html>
      <head>
        <style>
          table {
            border: 1px solid #555;
            border-collapse: collapse;
          }
          table {
            width: 100%;
          }
          td {
            padding: 4px;
            border: 1px solid #555;
            text-align: center;
          }
          td.notTested {
            background-color: #ccc;
            font-size: 40px;
            color: #999;
          }
          td.success {
            background-color: #${colors.lightGreen};
            color: #${colors.darkGreen};
            font-size: 40px;
          }
          td.failure {
            background-color: #${colors.lightRed};
            font-size: 40px;
            color: #${colors.darkRed};
          }
          td.heading {
            background-color: #888;
            font-size: 14px;
            color: white;
          }
          td.table td.heading {
            font-size: 12px;
          }
          td.table td.success, td.table td.failure, td.table td.notTested {
            font-size: 20px;
          }
          td.number {
            background-color: #${colors.lightOrange};
            color: #${colors.darkOrange};
            font-size: 12px;
            font-weight: bold;
          }
          td.table {
            background-color: #${colors.lighterOrange};
          }
          td.table table {
            margin: 0px auto;
          }
          body {
            font-family: Helvetica;
            font-size: 10px;
          }
          body * {
            font-size: inherit;
          }
        </style>
        <title>Appium Matrix</title>
      </head>
      <body>
        <%= table %>
      </body>
    </html>
`);

const tableTemplate = _.template(`
    <table class="<%= klass %>">
        <% _.forEach(rows, function (row) { %>
            <tr><% _.forEach(row, function (cell) { %>
                <td
                  <% if (cell === "\u2014") { %>
                      class="notTested"
                  <% } else if (cell === "\u2713") { %>
                      class="success"
                  <% } else if (cell === "\u2717") { %>
                      class="failure"
                  <% } else if (/^[0-9]\.[0-9]+/.test(cell)) { %>
                      class="number"
                  <% } else if (/<table/.test(cell)) { %>
                      class="table"
                  <% } else { %>
                      class="heading"
                  <% } %>
                ><%= _.encodeUnicode(cell) %></td>
            <% }); %></tr>
        <% }); %>
    </table>
`);

module.exports = { htmlTemplate, tableTemplate };
