#!/usr/bin/env node

// import all functions from utils
import {
    chooseFilePath,
    findNotesByIds,
    archiveAll,
    table,
    promptQuestion,
    promptDate,
    promptConfirm,
    getQuote,
    archivedNotes,
    sortedNotes,
    sortedNotesByDueDate,
    archivedNotesByDueDate
} from './utils/utils.js'
import * as R from 'ramda'
import * as fs from 'fs'
import { Command } from 'commander';
import { createRequire } from 'module';
import crypto from 'crypto'
import {encrypt, decrypt, getKey} from './utils/encryption.js'
const require = createRequire(import.meta.url);
const termkit = require( 'terminal-kit' ) ;
const term = termkit.terminal ;
const inquirer = require('inquirer');
inquirer.registerPrompt('datetime', require('inquirer-datepicker-prompt'))


const program = new Command();

const args = process.argv
const currentWorkingDirectory = args[1].slice(0, -8);
let notesList
if (fs.existsSync(`${currentWorkingDirectory}/list.json`) === false) {
    notesList = fs.createWriteStream(`${currentWorkingDirectory}/list.json`)
    notesList.write('[]')
} else {
    notesList = JSON.parse(fs.readFileSync(`${currentWorkingDirectory}/list.json`))
}

const writeFile = (data) => fs.writeFile(`${currentWorkingDirectory}/list.json`, JSON.stringify(data, null, 2), (err) => {
    if (err) throw err;
})

const options = program.opts()

// program methods
const openMenu = async () => {
    if(notesList.encryptedData) {
        term.bold.red('Encrypted notes, please decrypt first\n')
        return
    }
    console.clear();
    let items = sortedNotesByDueDate(notesList)
    items = R.values(items)
    if (items[0]?.length > 0) {
        items[0].unshift({
            title: 'Reminders',
            id: 0
        })
    }
    if (items[1]?.length > 0) {
        items[1].unshift({
            title: 'Notes',
            id: -1
        })
    }
    items = items[0].concat(items[1]).filter(item => item)
    inquirer.prompt([
        {
            type: 'checkbox',
            name: 'notes',
            message: 'Select notes to archive',
            loop: false,
            // first choice in items[0] should be disabled and first choice in items[1] should be disabled
            choices: items.map(item => ({
                name: item.dueDate ? `${item.title} [due: ${item.dueDate}]` : item?.title,
                value: item?.id,
                disabled: item?.id === 0 || item?.id === -1,
                loop: false
            }))
        }
    ]).then(answers => {
        const selectedNotes = answers.notes
        if (selectedNotes.length === 0) {
            term.bold.red('No notes selected')
            return;
        }
        term.bold.green('Selected notes:')
        term.bold.green(selectedNotes.join(', '))
        // archive selected notes
        done(selectedNotes)
        setTimeout(() => {
            list()
        }, 1000)
    })
}

const list = async () => {
    if(notesList.encryptedData) {
        term.bold.red('Encrypted notes, please decrypt first\n')
        return
    }
    console.clear();
    // if option sortByDueDate is true, sort by due date
    if (options.archived) {
        if (archivedNotes(notesList)) {
            term.bgBrightBlack('\nArchived notes:\n');
            if (options.sortByDueDate) {
                table(archivedNotesByDueDate(notesList))
            } else {
                table(archivedNotes(notesList))
            }
        } else {
            term.brightRed('No archived notes.');
        }
    } else if (options.sortByDueDate) {
        term.bgBrightBlack('\nReminders\n');
        if(sortedNotesByDueDate(notesList).reminders?.length > 0) {
            table(sortedNotesByDueDate(notesList).reminders)
        } else {
            term.brightRed('No reminders\n');
        }
        term.bgBrightBlack('\nNotes\n');
        if(sortedNotesByDueDate(notesList).notes?.length > 0) {
            table(sortedNotesByDueDate(notesList).notes)
        } else {
            term.brightRed('No notes\n');
        }
    } else {
        term.bgBrightBlack('\nReminders\n');
        if(sortedNotes(notesList).reminders?.length > 0) {
            table(sortedNotes(notesList).reminders)
        } else {
            term.brightRed('No reminders\n');
        }
        term.bgBrightBlack('\nNotes\n');
        if(sortedNotes(notesList).notes?.length > 0) {
            table(sortedNotes(notesList).notes)
        } else {
            term.brightRed('No notes\n');
        }    
    }
    // print random quote
    term.brightBlack('\n\n');
    const quote = await getQuote();
    term.brightBlack(term.italic(`"${quote.text}"\n\n- ${quote.author}\n\n`));
    promptConfirm('Add a note?').then(answer => answer ? add() : term.processExit())
}

const add = async (addtitle) => {
    if(notesList.encryptedData) {
        term.bold.red('Encrypted notes, please decrypt first\n')
        return
    }
    term.clear();
    const title = addtitle ? addtitle : await promptQuestion('\nEnter title: ')
    if(!title) {
        term.brightRed('\nNo title entered.')
        term.processExit()
        return
    }
    let _dueDate = null
    if (options.dueDate || !addtitle) {
        const answer = await promptConfirm('\nAdd due date?')
        if (answer) {
            _dueDate = await promptDate()
        }
    }
    const note = {
        id: notesList.length + 1,
        title,
        dueDate:_dueDate,
        archived: false,
        createdAt: new Date().toISOString(),
    }
    notesList.push(note)
    writeFile(notesList)
    if (note.dueDate) {
        term.bold.green(`\nReminder added: ${note.title} [due: ${note.dueDate}]\n`);
    } else {
        term.bold.green(`\nNote added: ${note.title}\n`);
    }
    // wait one second before showing list
    setTimeout(() => {
        list()
    }, 1000) 
}

const done = async (ids) => {
    if(notesList.encryptedData) {
        term.bold.red('Encrypted notes, please decrypt first\n')
        return
    }
    console.clear();
    const res = ids.length > 0 ? ids : await promptQuestion('Enter note(s) id(s): ')
    if(!res) {
        term.brightRed('\nNo note(s) selected.')
        term.processExit()
    }
    const resArr = res.map(id => parseInt(id))
    const notes = findNotesByIds(resArr, notesList)
    // if no notes or undefined notes, exit
    if (notes.length === 0) {
        term.brightRed('\nCould not find note(s)');
        term.processExit()
        return
    }
    term.brightGreen(`\nMarking ${notes.length} note(s) as archived\n`)
    archiveAll(notes)
    writeFile(notesList);
    // wait one second before showing list
    setTimeout(() => {
        list()
    }, 1000)
}


const allDone = () => {
    if(notesList.encryptedData) {
        term.bold.red('Encrypted notes, please decrypt first\n')
        return
    }
    term.clear();
    promptConfirm('\nMark all notes as done?').then(answer => {
        if (answer) {
            archiveAll(notesList)
            writeFile(notesList)
            term.brightGreen('\nAll notes archived.');
            return;
        }
        term.brightRed('\nNo notes archived.\n');
        term.processExit()
        return
    })
}

const encryptList = async () => {
    term.clear();
    const key = await getKey()
    if (!key) {
        term.brightRed('\nNo key entered.')
        term.processExit()
        return
    }
    term.red(`you need to save this key to decrypt your list later:\n` );
    term.green(key.key.toString('hex'));
    const encrypted = encrypt(JSON.stringify(notesList), key.key, key.iv);
    notesList = encrypted
    writeFile(notesList)
    term.brightGreen('\nNotes encrypted.\n');
    return;
}

const decryptList = async () => {
    term.clear();
    // prompt for key
    const key = await promptQuestion('\nEnter key: ')
    if (!key) {
        term.brightRed('\nNo key entered.')
        term.processExit()
        return
    }
    try {
        const decrypted = decrypt(notesList, key);
        notesList = JSON.parse(decrypted)
        writeFile(notesList)
        term.brightGreen('\nNotes decrypted.\n');
        // wait one second before showing list
        setTimeout(() => {
            list()
        }, 1000)
        return;
    } catch (e) {
        term.brightRed('\nCould not decrypt notes.');
        term.processExit()
        return;
    }
}




// program definition
program
    .name('clitodo')
    .version('0.0.1')
    .description('CLI Notes')

program
    .command('list')
    .alias('l')
    .description('List all notes')
    .action(list)
    .option('-s, --dueDate', 'Sort by due date') // TODO: not working
    .option('-a, --archived', 'Show archived notes')

program
    .command('add')
    .alias('a')
    .description('Add a note')
    .action(add)
    .option('-d, --dueDate', 'Add with due date')
    .argument('[title]', 'Title of note')

program
    .command('done')
    .alias('d')
    .description('Mark a note as done')
    .action(done)
    .argument('[ids...]', 'List of ids')

program
    .command('allDone')
    .alias('ad')
    .description('Mark all notes as done')
    .action(allDone)

program
    .command('openMenu')
    .alias('om')
    .description('Open menu')
    .action(openMenu)

program
    .command('encryptList')
    .alias('el')
    .description('Encrypt list of notes to file')
    .action(encryptList)

program
    .command('decryptList')
    .alias('dl')
    .description('Decrypt list of notes from file')
    .action(decryptList)

program
    .option('-i, --id [ids]' , 'Mark a note as done by ids')
    .option('-d, --dueDate', 'Add with due date')
    .option('-s, --sort', 'Sort by due date')
    .option('-a, --archived', 'Show archived notes')


program.parse();
// const limit = options.first ? 1 : undefined;
// console.log(program.args[0].split(options.separator, limit))