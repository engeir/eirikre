const navbar = document.createElement('template');
navbar.innerHTML = `
      <nav class="flexbox">
        <a href="/">Home</a>
        <!-- <img src="images/flott-flyt.png" class="logo"> -->
        <ul class="fullwidth">
          <li><a href="projects.html">Projects</a></li>
          <li><a href="studio.html">Studio</a></li>
          <li><a href="ralekkert.html">Rålekkert</a></li>
          <li><a href="about.html">About</a></li>
        </ul>
      </nav>
`
const footer = document.createElement('template');
footer.innerHTML = `
<footer class="page-footer">
  <ul>
    <li><a href="https://github.com/engeir"><i class="fa fa-github"></i></a></li>
    <li><a href="https://twitter.com/EngerEirik"><i class="fa fa-twitter"></i></a></li>
    <li><a href="https://www.instagram.com/eirikre/"><img class="insta"
    style="max-height:19px;max-width:19px" src="images/instagram-logo.png"
    alt="Instagram"></a></li>
    <li><a href="https://www.linkedin.com/in/eirik-rolland-enger/"><i class="fa
    fa-linkedin"></i></a></li>
    <li><a href="images/wallet-of-satoshi.png"><img class="wos"
    style="max-height:16px;max-width:16px" src="images/wallet-of-satoshi-icon.png"
    alt="Wallet of Satoshi"></a></li>
  </ul>
</footer>
`

document.getElementById('nav').appendChild(navbar.content);
document.getElementById('foot').appendChild(footer.content);
