# APEX Team Roles & Password Reset Configuration Guide

This document outlines all team role permissions, user role seeds, and authentication reset procedures for APEX Values & WIKI.

---

## 1. Team Role Hierarchy & Permission Levels

| Role | Title / Badge | Granted Permissions |
|---|---|---|
| `owner` | Owner 👑 | **Full System Access**: Values, WIKI, Maps, Crates, Announcements, Bug Reports, Team Activity Analytics, Pizza Donut Charts, and Log Email visibility. |
| `admin_plus` | Admin+ 🔨 | **Full Admin Access**: Values, WIKI, Maps, Crates, Announcements, Bug Reports. |
| `admin` | Admin 🔨 | **Standard Admin**: Values, WIKI, Maps, Crates, Announcements, Bug Reports. |
| `lead_wiki_editor` | Lead WIKI Editor 📃 | **WIKI Operations Lead**: WIKI overrides, custom units, maps, crates, and WIKI log access. |
| `lead_value_editor` | Lead Value Editor 💵 | **Values Operations Lead**: Live value entries, demand/scarcity parameters, trends, and Value log access. |
| `wiki_editor` | WIKI Editor 📃 | WIKI unit parameter overrides, artwork uploads, map & crate wiki management. |
| `value_editor` | Value Editor 💵 | Live unit value, gems, coins, demand multiplier, scarcity tier, and notes editing. |

---

## 2. Configured Team Members Seed List

```sql
insert into public.admin_users (email, role) values
  ('gustavo.rb1410@gmail.com', 'owner'),
  ('bananatempest25@gmail.com', 'admin_plus'),
  ('treymurphy3rd@gmail.com', 'admin'),
  ('jiteaianis@gmail.com', 'wiki_editor'),
  ('gloomy302010@gmail.com', 'wiki_editor'),
  ('dakingnub@gmail.com', 'wiki_editor'),
  ('destroyha3@gmail.com', 'value_editor'),
  ('johnmustard129@gmail.com', 'wiki_editor'),
  ('alieldaw6@gmail.com', 'wiki_editor'),
  ('hungryaistukas@gmail.com', 'value_editor'),
  ('luquitas290414@gmail.com', 'wiki_editor'),
  ('hellfiregamingytt@gmail.com', 'value_editor')
on conflict (email) do update set role = excluded.role;
```

---

## 3. Password Reset Flow Procedures

1. **Request Reset Link**: On the `/admin` page, click **Send Password Reset Email** and type the editor email address.
2. **Open Secure Recovery Link**: Click the link sent to your inbox. It routes back to `/admin/reset-password`.
3. **Set New Password**: Enter your new password (minimum 8 characters) and confirm.
