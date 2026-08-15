# Network Analysis

## Website Tested

**Website:** Cricbuzz
**URL:** https://www.cricbuzz.com/

The website was opened in Chrome and analyzed using **DevTools → Network**. The **Disable cache** option was enabled before reloading the page.

## Network Results

### 1. Request Count

**335 requests** were observed in the Network panel during the captured analysis.

### 2. Total Page Size

- **Transferred:** 4.1 MB
- **Resources:** 11.5 MB

The transferred size represents the data downloaded during the page load, while the resources size represents the total size of the loaded resources.

### 3. Slowest Resource

The Network panel was sorted by the **Time** column in descending order.

The captured view showed resources taking several seconds to complete, with the slowest visible request taking approximately **4.19 seconds**.

The exact resource name of the overall slowest request could not be confirmed from the captured Network view, so it is not being guessed.

### 4. 3xx Responses

A **302** response was observed for one of the requests.

**302 Found** is a redirection response. It means the requested resource temporarily redirects the client to another location.

### 5. 4xx Responses

No clear **4xx response** was observed in the captured Network results.

## Conclusion

The Cricbuzz page generated a large number of network requests because it loads multiple scripts, images, advertisements, tracking resources, and other page components. The page transferred approximately **4.1 MB** of data and loaded resources totaling approximately **11.5 MB**. A **302 redirection** was observed, while no clear 4xx response was identified.
