\# AGENTS.md



\## Project Name



GitHub Repository Intelligence Dashboard



\## Project Overview



This application helps users analyze, organize, and manage a large collection of GitHub repositories.



The primary use case is for someone who creates many repositories over time, including software projects, experiments, class projects, prototypes, and AI-assisted development projects. As the number of repositories grows, it becomes difficult to remember:



\- What each repository does

\- Why it was created

\- Whether it is still active

\- How complete it is

\- When it was last worked on

\- Which repositories are related

\- Which repositories are older versions of the same project

\- Which repositories should remain private

\- Which repositories could be made public

\- Which repositories should be archived

\- Which repositories may no longer be worth keeping



The application should provide a centralized dashboard that analyzes GitHub repositories and helps the user make informed decisions about them.



The application should not automatically make destructive changes. It should analyze, recommend, and allow the user to explicitly approve management actions.



\---



\# Primary Goals



The application should:



1\. Connect to a user's GitHub account.

2\. Retrieve repositories and useful metadata.

3\. Analyze the contents of repositories.

4\. Generate a concise explanation of what each project appears to be.

5\. Determine the apparent state or health of each project.

6\. Detect repositories that appear related or duplicated.

7\. Make recommendations for repository management.

8\. Allow the user to organize, filter, search, and categorize repositories.

9\. Allow approved GitHub actions such as archive, visibility changes, or deletion.

10\. Help the user rediscover forgotten projects.



\---



\# Core User Experience



The main interface should resemble a project management dashboard rather than the standard GitHub repository list.



The user should be able to quickly scan their projects and answer questions such as:



\- What is this project?

\- When did I last work on it?

\- Is it finished?

\- Is it abandoned?

\- What technologies does it use?

\- Does another repository contain a newer version?

\- Is this related to another project?

\- Should I archive this?

\- Could this be made public?

\- Which projects might be worth continuing?

\- Which repositories appear to be duplicates?

\- Which repositories have I not touched in several years?



The application should emphasize fast decision-making.



\---



\# Repository Dashboard



Create a primary repository dashboard.



Each repository should display information such as:



\- Repository name

\- Description

\- Owner

\- Public/private status

\- Archived status

\- Fork status

\- Creation date

\- Last updated date

\- Last push date

\- Last commit date

\- Repository size

\- Primary language

\- Technologies detected

\- Number of branches

\- Number of open issues

\- Number of pull requests

\- Stars

\- Forks

\- Default branch

\- README availability

\- License

\- GitHub Pages status if available

\- Deployment information if detectable



Also display AI-generated information such as:



\- Project summary

\- Project purpose

\- Estimated project type

\- Estimated development status

\- Estimated completeness

\- Suggested next action

\- Confidence level of the analysis



\---



\# Repository Summary



Generate an AI summary for each repository.



The summary should preferably be one or two sentences and written in plain language.



Example:



> A small Unreal Engine prototype demonstrating projectile weapons, enemy AI, and a basic score system. It appears to have been created as a classroom demonstration and has not been updated in approximately two years.



The summary may use information from:



\- README

\- Repository description

\- File structure

\- Package files

\- Source code

\- Commit messages

\- Configuration files

\- Documentation

\- GitHub topics

\- Branch names



Do not rely entirely on the README because many repositories may have incomplete or outdated READMEs.



\---



\# Technology Detection



Determine the major technologies used by each repository.



Examples include:



\- C++

\- C#

\- Java

\- Python

\- JavaScript

\- TypeScript

\- React

\- Next.js

\- Node.js

\- Unity

\- Unreal Engine

\- SDL

\- Box2D

\- FMOD

\- Firebase

\- Supabase

\- Docker

\- Raspberry Pi

\- Arduino



Technology detection should use multiple signals when possible.



Examples:



\- package.json

\- requirements.txt

\- pyproject.toml

\- CMakeLists.txt

\- .csproj

\- .sln

\- .uproject

\- Unity project folders

\- Dockerfile

\- Cargo.toml

\- pom.xml

\- build.gradle



\---



\# Project Type Classification



Attempt to classify repositories.



Possible classifications include:



\- Application

\- Web Application

\- Mobile Application

\- Game

\- Game Engine

\- Game Prototype

\- Classroom Demo

\- Student Example

\- Assignment Starter

\- Teaching Material

\- Utility

\- Library

\- Framework

\- Experiment

\- AI Experiment

\- Hardware Project

\- Raspberry Pi Project

\- Research Project

\- Archived Project

\- Unknown



Classification should be editable by the user.



\---



\# Project Status



Estimate the current development status.



Suggested statuses:



\- Active

\- Recently Active

\- Paused

\- Prototype

\- Experimental

\- Mostly Complete

\- Complete

\- Maintenance

\- Abandoned

\- Superseded

\- Archive Candidate

\- Unknown



Status should never be treated as absolute truth.



Display it as an AI recommendation that the user can override.



\---



\# Activity Analysis



Analyze repository activity.



Useful metrics include:



\- Days since last commit

\- Days since last push

\- Commits in the last 30 days

\- Commits in the last 90 days

\- Commits in the last year

\- Total commits if practical

\- Number of contributors

\- Recent branches

\- Recent pull requests

\- Recent issues



Use these metrics to identify projects that may have become inactive.



Example recommendation:



> No commits in 3.4 years. This repository appears to be inactive and may be a good archive candidate.



\---



\# Repository Similarity Detection



A major feature of the application is detecting related repositories.



This is especially important for repositories created repeatedly over multiple years or academic quarters.



For example:



\- GameProgramming2024

\- GameProgramming2025

\- GameProgramming2026

\- GAT360-Summer-2025

\- GAT360-Fall-2025

\- GAT360-Summer-2026



These may represent versions or descendants of the same project.



Similarity analysis should consider:



\- Repository name

\- Description

\- README content

\- Folder structure

\- File names

\- Programming languages

\- Frameworks

\- Dependencies

\- Commit messages

\- Source code similarity

\- Creation dates



Create a similarity score.



Example:



`87% similar`



\---



\# Repository Clusters



Allow related repositories to be grouped into clusters.



Example:



\## SDL Game Engine



\- GameEngine2024

\- SDLGameEngine

\- GAT150Engine

\- EngineDemo2025

\- EngineProjectsSummer2026



The application should attempt to determine whether repositories are:



\- Copies

\- Fork-like descendants

\- Classroom variations

\- Yearly versions

\- Experimental branches

\- Related projects



Allow the user to manually add or remove repositories from clusters.



\---



\# Project Lineage



Where possible, attempt to determine project evolution.



Example:



GameEngine2024  

↓  

GameEngine2025  

↓  

GAT150Engine2026



Display the apparent newest or most active version.



Example:



> This repository appears to have been superseded by `GAT150Engine2026`.



This could make older repositories strong archive candidates.



\---



\# Similarity Visualization



Provide a visual method of exploring related repositories.



Possible interface:



\- Graph view

\- Network diagram

\- Cluster view

\- Timeline



Repositories are nodes.



Connections represent similarity.



Stronger similarity should create stronger connections.



The visualization should be considered secondary to the primary dashboard.



\---



\# Repository Recommendations



The system should provide recommended actions.



Possible recommendations include:



\- Keep Active

\- Continue Development

\- Review

\- Archive

\- Make Public

\- Make Private

\- Add README

\- Add Description

\- Add License

\- Add Topics

\- Rename

\- Consolidate

\- Compare with Similar Repository

\- Superseded by Newer Repository

\- Delete Candidate



Recommendations must include a reason.



Example:



> Archive Candidate  

> Last updated 4 years ago and appears to have been replaced by `SDLGameEngine2026`.



\---



\# Repository Health Score



Optionally calculate a Repository Health Score.



Example:



`72 / 100`



Possible factors:



\- Recent activity

\- README quality

\- Project description

\- License

\- Documentation

\- Repository organization

\- Build configuration

\- Active issues

\- Recent commits

\- Project completeness



The score should primarily help with sorting and prioritization.



It should not imply that old repositories are inherently bad.



\---



\# Repository Management



Allow users to perform GitHub management operations.



Potential actions:



\- Archive repository

\- Unarchive repository

\- Change visibility to public

\- Change visibility to private

\- Rename repository

\- Update description

\- Add topics

\- Remove topics

\- Delete repository



Destructive actions must always require explicit confirmation.



Deletion should require stronger confirmation than other actions.



Example:



> Delete `OldGamePrototype` permanently?



Require the repository name to be entered before deletion.



\---



\# Bulk Actions



Allow selection of multiple repositories.



Examples:



\- Archive selected repositories

\- Make selected repositories private

\- Make selected repositories public

\- Add tag

\- Add category

\- Mark as reviewed

\- Request AI reanalysis

\- Add to project cluster



Bulk destructive actions must require confirmation.



\---



\# Review Workflow



Add a review system so the user can gradually work through a large repository collection.



Possible review states:



\- Unreviewed

\- Reviewed

\- Keep

\- Archive

\- Investigate

\- Delete Candidate



Provide a dedicated Review Mode.



Review Mode should present one repository at a time.



Example layout:



Repository Name



AI Summary



Last Activity



Technologies



Related Repositories



Recommendation



Actions:



\[Keep]

\[Archive]

\[Investigate]

\[Delete Candidate]



Then automatically advance to the next repository.



This should make reviewing hundreds of repositories manageable.



\---



\# User Notes



Allow private notes to be attached to repositories.



Examples:



> Used for my Fall 2025 Unreal class.



> Keep this because it contains my original Box2D implementation.



> Might use this for a YouTube video later.



Notes should remain inside the application and should not modify the GitHub repository unless explicitly requested.



\---



\# Tags



Allow custom tags.



Examples:



\- Teaching

\- Unreal

\- Unity

\- C++

\- AI

\- YouTube

\- Experiment

\- Student Demo

\- Keep

\- Review Later

\- Portfolio

\- Raspberry Pi



Repositories may contain multiple tags.



\---



\# Favorites



Allow repositories to be marked as favorites.



Favorites should be easy to access from the dashboard.



\---



\# Natural Language Search



Support natural language repository searches.



Examples:



> Show me Unreal projects I haven't touched in two years.



> Find all Raspberry Pi projects.



> Find repositories related to my game engine class.



> Show me private repositories that look finished.



> Find projects that could be good portfolio projects.



> Find likely duplicates.



> Show me repositories that probably need to be archived.



> Find React projects created in 2025.



The search system should translate the user's request into filters and semantic queries.



\---



\# Search and Filters



Traditional filters should also be available.



Examples:



\- Name

\- Language

\- Technology

\- Project type

\- Status

\- Visibility

\- Archived

\- Fork

\- Date created

\- Date updated

\- Last commit date

\- Similarity group

\- Tags

\- Review state

\- AI recommendation



Filters should be combinable.



\---



\# Sorting



Support sorting by:



\- Name

\- Creation date

\- Last activity

\- Last commit

\- Size

\- Similarity

\- Health score

\- Completeness

\- Recommendation

\- Review status



\---



\# Dashboard Statistics



Provide overview statistics.



Example:



238 repositories



42 Active  

37 Recently Active  

61 Archive Candidates  

12 Delete Candidates  

48 Classroom Projects  

31 Experiments  

17 Possible Duplicate Groups



Additional charts may show:



\- Repositories by year

\- Repositories by language

\- Repositories by technology

\- Repositories by activity

\- Public vs private

\- Project types



\---



\# Repository Detail Page



Each repository should have a detailed view.



Sections may include:



\## Overview



Project summary and metadata.



\## AI Analysis



Purpose, status, completeness, and recommendations.



\## Technologies



Detected languages, frameworks, libraries, and tools.



\## Activity



Commit and repository history.



\## Files



Important files discovered during analysis.



\## Related Projects



Similar repositories and similarity scores.



\## Timeline



Major repository activity.



\## Notes



User notes and custom tags.



\## Management



GitHub actions.



\---



\# AI Analysis Strategy



AI analysis should use a staged process to avoid unnecessary API and token usage.



\### Stage 1: Metadata Analysis



Analyze GitHub metadata.



This should be inexpensive.



\### Stage 2: Repository Structure



Retrieve:



\- file names

\- directory structure

\- manifest files

\- README

\- configuration files



\### Stage 3: Targeted File Analysis



Only inspect important files.



Examples:



\- README.md

\- package.json

\- CMakeLists.txt

\- main source files

\- project configuration

\- dependency files



Avoid sending entire repositories to an AI model.



\### Stage 4: AI Summary



Generate structured repository analysis.



Store the results locally so repositories do not need to be repeatedly analyzed.



\---



\# Suggested AI Analysis Output



Use structured output similar to:



```json

{

&#x20; "summary": "Small SDL-based C++ game engine used for classroom demonstrations.",

&#x20; "projectType": "Game Engine",

&#x20; "status": "Paused",

&#x20; "completion": 78,

&#x20; "technologies": \[

&#x20;   "C++",

&#x20;   "SDL3",

&#x20;   "Box2D",

&#x20;   "FMOD"

&#x20; ],

&#x20; "recommendation": "Keep",

&#x20; "recommendationReason": "Appears to be an actively useful teaching project.",

&#x20; "confidence": 0.88

}

