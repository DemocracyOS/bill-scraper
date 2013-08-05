cedom-scraper
=============

Modules
-------

### cedom-interfase

Is the control module. Interacts with `cedom` to access CEDOM information and with the `db-manager` to read and write data to the database.

### cedom

Provides a common API, abstracting user modules about the actual way to read data from the CEDOM. It may use an scraper to get data from CEDOM website pages or, if/when available, it may use any JSON/XML CEDOM API.

### html-scraper

It takes an URL, a configuration of items to be extracted (selectors?) and returns a JSON containing all extracted data.

### db-manager

Establishes the connection to the database and provides an interfase to read and write data to it.

WIP
---

- Remove all old and unused modules, files, code.
- Check if using a jQuery-like selector API helps. cheerio looks like a good choice.

Coding convention
=================

- Use 2-spaces instead of tabs.
- Use double quotes for string.

License
=======

MIT?
