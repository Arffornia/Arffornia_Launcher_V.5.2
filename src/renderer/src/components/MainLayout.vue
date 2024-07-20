<template>
  <div>
    <header>
      <h1>My App</h1>
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
      </nav>
    </header>

    <main>
      <router-view></router-view>
    </main>

    <footer>
      <p>© 2024 My App</p>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
header {
  background-color: #333;
  color: white;
  padding: 1em;
}

nav a {
  color: white;
  margin: 0 1em;
  text-decoration: none;
}

footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 1em;
  margin-top: 2em;
}
</style>
