import * as R from 'ramda'
import fetch from 'node-fetch';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const termkit = require( 'terminal-kit' ) ;
const term = termkit.terminal ;
const inquirer = require('inquirer');
inquirer.registerPrompt('datetime', require('inquirer-datepicker-prompt'))

// general functions


const findNotesByIds = (ids, data) => {
    const res = ids.map(id => {
        const note = data.find(note => note.id === id)
        if (note) {
            return note
        }
        term.brightRed(`\nNote with id ${id} not found`)
        term.processExit()
    })
    // remove undefined items
    return res.filter(item => item)
}

const archiveAll = (data) => data.forEach(note => note.archived = true)

const table = (notes) => {
    const table = [
        ['^YID', '^YTitle', '^YDue Date']
    ]
    notes.forEach(note => table.push([note.id, note.title, note.dueDate]))
    term.table(table, 
        {
            hasBorder: true ,
            contentHasMarkup: true ,
            borderChars: 'lightRounded' ,
            borderAttr: { color: 'blue' } ,
            textAttr: { bgColor: 'default' } ,
            firstCellTextAttr: { bgColor: 'blue' } ,
            firstRowTextAttr: { bgColor: 'green' } ,
            firstColumnTextAttr: { bgColor: 'red' } ,
            width: term.width/1.5,
            padding: 1,
            fit: true   // Activate all expand/shrink + wordWrap
        }
    )
}

const promptQuestion = async (question) => {
    const answer = await inquirer.prompt([
        {
            type: 'input',
            name: 'answer',
            message: question
        }
    ]).then(answers => {
        return answers.answer
    })
    return answer
}

const promptDate = async () => {
    const answer = await inquirer.prompt([
        {
            type: 'datetime',
            name: 'answer',
            message: 'Enter due date',
            format: ['mm', '/', 'dd', '/', 'yyyy', ' ', 'hh', ':', 'MM']
        }
    ]).then(answers => {
        return answers.answer
    })
    return answer
}

const promptConfirm = async (question) => {
    const answer = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'answer',
            message: question
        }
    ]).then(answers => {
        return answers.answer
    })
    return answer
}

// get random quote
const getQuote = async () => {
    const endpoint = 'https://programming-quotes-api.herokuapp.com/Quotes/random'
    const response = await fetch(endpoint)
    const data = await response.json()
    const author = data.author
    const text = data.en
    return {
        author,
        text
    }
}

// filtering and sorting functions
const filterNotes = R.filter(R.propEq('archived', false));

const archivedNotes = R.filter(R.propEq('archived', true));

const sortByCreatedAt = R.sortBy(R.prop('createdAt'));
const sortByCreatedAtDescending = R.compose(R.reverse, sortByCreatedAt);

const sortByDueDate = R.sortBy(R.prop('dueDate'));
const sortByDueDateDescending = R.compose(R.reverse, sortByDueDate);

const groupByType = R.groupBy(n => n.dueDate ? 'reminders' : 'notes');

const importantFields = R.project(['id','title', 'dueDate']);

const filterByType = R.compose(groupByType, sortByCreatedAtDescending)

const sortedNotes = R.compose(
    filterByType,
    importantFields,
    filterNotes
)

const sortedNotesByDueDate = R.compose(
    filterByType,
    importantFields,
    sortByDueDateDescending,
    filterNotes
)

const archivedNotesByDueDate = R.compose(
    filterByType,
    importantFields,
    sortByDueDateDescending,
    archivedNotes
)

export {
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
}