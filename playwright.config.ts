import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',workers:1,timeout:60000,use:{baseURL:'http://127.0.0.1:3000',viewport:{width:1440,height:900},trace:'retain-on-failure'},reporter:[['list'],['html',{open:'never'}]]});
