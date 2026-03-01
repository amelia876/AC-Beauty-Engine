import { readdirSync } from "fs";
console.log("cwd:", process.cwd());
try { console.log("cwd contents:", readdirSync(process.cwd())); } catch(e) { console.log(e.message); }
try { console.log("/home/user contents:", readdirSync("/home/user")); } catch(e) { console.log(e.message); }
