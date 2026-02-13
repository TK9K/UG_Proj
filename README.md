# A Web Based Affective Task Manager

### Login Information
I have used Firebase authentication to implement user authentication into my application, as there is no current database
setup for the project there are no 'users' in the application.

You are free to create your own account using the registration form on the page, currently an email needs to be provided
in a valid format e.g. email@domain.com however there is no currently no requirement to validate the email address. Passwords
must be at least 6 digits in length and for simplicity this is the only requirement.

### Setup

#### Running the Code & Installing Dependencies
Once you have downloaded the code for my project you will need to install the required dependencies in order for it to
function correctly, in a terminal window in the project directory run:

`npm install`

This will install all required dependencies, the code can then be executed by running:

`npm run dev`

The application will then be accessible by http://localhost:5173/login

#### API Keys
I have provided the files used to contain my API keys without the actual keys included these should be replaced with
appropriate keys for both OpenAI (to provide the task breakdown functionality) / Firebase (to provide the database / 
authentication for the project) 

### Previous Application Design
Some of the pages in my repository are no longer in use due to being replaced with newly designed versions of the pages,
the original source code of these can be found on the 'master' branch of my repository. These pages were created using
my original React-Bootstrap based component library.

### SHADCN/UI
Many of the components included in my application come from the ShadCN/UI component
library found in src/src/components/ui, these components are largely used as is, however some have specific modifications
made in order to better fit the styles of my website or to provide extra functionality
such as with the button.jsx component where I have created a ButtonLoading, for loading states in my application
and a custom colour for the 'warn' button which was something I had used previously when my website used Bootstrap styling.
All relevant documentation for each of the components provided is available at https://ui.shadcn.com/docs/components/