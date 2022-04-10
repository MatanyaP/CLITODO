<h1 align="center">Welcome to clitodo 👋</h1>
<p>
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-yellow.svg" />
  </a>
</p>

> A simple cli todo app with unnecessary features

### 🏠 [Homepage](https://github.com/MatanyaP/CLITODO)

## Install

```sh
npm install
```

## Usage

```sh
To install globally in your system:
npm install -g .
Then run the app:
clitodo
will open the help menu

Usage: clitodo [options] [command]

CLI Notes

Options:
  -V, --version            output the version number
  -i, --id [ids]           Mark a note as done by ids
  -d, --dueDate            Add with due date
  -s, --sort               Sort by due date
  -a, --archived           Show archived notes
  -h, --help               display help for command

Commands:
  list|l [options]         List all notes
  add|a [options] [title]  Add a note
  done|d [ids...]          Mark a note as done
  allDone|ad               Mark all notes as done
  openMenu|om              Open menu
  encryptList|el           Encrypt list of notes to file
  decryptList|dl           Decrypt list of notes from file
  help [command]           display help for command
```

## Run tests

```sh
npm run test
```

## Author

👤 **Matan Peretz**

* Github: [@MatanyaP](https://github.com/MatanyaP)

## Show your support

Give a ⭐️ if this project helped you!

# Roadmap:
- ~~encrypt notes with a key~~
- text to speech
- export to html
- export to sprite
- today
- email notifications
- and many more unnecessary features to make you life more complicated
