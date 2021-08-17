const footer = document.createElement('template');
footer.innerHTML = `
<footer class="page-footer">
  <ul>
    <li><a href="https://github.com/engeir"><i class="fa fa-github"></i></a></li>
    <li><a href="https://twitter.com/EngerEirik"><i class="fa fa-twitter"></i></a></li>
    <li><a href="https://www.linkedin.com/in/eirik-rolland-enger/"><i class="fa fa-linkedin"></i></a></li>
  </ul>
</footer>
`

// document.body.appendChild(footer.content);
document.getElementById('foot').appendChild(footer.content);
