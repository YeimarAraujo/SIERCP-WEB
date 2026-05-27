'use client';

import React, { useState, useEffect, useRef } from "react";
import { Container } from "react-bootstrap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useThemeStore } from "@/stores/theme-store";
import { useAuthMinimal } from "@/shared/hooks/use-auth-minimal";
import { cursos } from "@/data/cursos";
import { servicios } from "@/data/servicios";

const links: Array<{ href: string; label: string; type: 'link' | 'mega' }> = [
  { href: "/", label: "Inicio", type: "link" },
  { href: "/programas", label: "Programas", type: "mega" },
  { href: "/planes", label: "Planes", type: "link" },
  { href: "/acerca", label: "Software", type: "link" },
  { href: "/nosotros", label: "Nosotros", type: "link" },
  { href: "/contacto", label: "Contacto", type: "link" },
];

const logoLight = "/assets/JOMAR/logoTextov2.png";
const logoDark = "/assets/JOMAR/LogoTexto.png";

export default function Navbar({ forceScrolled = false }: { forceScrolled?: boolean }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthMinimal();
  const isDark = theme === 'dark';

  const [scrolled, setScrolled] = useState(forceScrolled);
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const megaRef = useRef<HTMLDivElement>(null);
  const megaTimeout = useRef<NodeJS.Timeout | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    if (forceScrolled) { setScrolled(true); return; }
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [forceScrolled]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isScrolled = scrolled || forceScrolled;

  const navStyle = {
    position: "fixed" as const,
    top: isScrolled ? "15px" : "0",
    left: "50%",
    transform: "translateX(-50%)",
    width: isScrolled ? "calc(100% - 40px)" : "100%",
    maxWidth: isScrolled ? "1200px" : "100%",
    zIndex: 2000,
    transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
    padding: isScrolled ? "12px 0" : "22px 0",
    background: isScrolled ? (isDark ? "rgba(11, 15, 25, 0.85)" : "rgba(255, 255, 255, 0.85)") : "transparent",
    backdropFilter: isScrolled ? "blur(16px)" : "none",
    WebkitBackdropFilter: isScrolled ? "blur(16px)" : "none",
    borderRadius: isScrolled ? "22px" : "0",
    border: isScrolled ? `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}` : "none",
    boxShadow: isScrolled ? (isDark ? "0 20px 40px rgba(0,0,0,0.4)" : "0 20px 40px rgba(0,0,0,0.05)") : "none",
    opacity: mounted ? 1 : 0,
  };

  // Mega menu handlers
  const handleMegaEnter = () => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  };
  const handleMegaLeave = () => {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 200);
  };

  // User menu handlers — mismo patrón con timeout para el "puente"
  const handleUserMenuEnter = () => {
    if (userMenuTimeout.current) clearTimeout(userMenuTimeout.current);
    setUserMenuOpen(true);
  };
  const handleUserMenuLeave = () => {
    userMenuTimeout.current = setTimeout(() => setUserMenuOpen(false), 150);
  };

  const userDashboard = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    ? '/admin/dashboard'
    : user?.role === 'INSTRUCTOR' ? '/instructor/dashboard' : '/student/home';

  const userProfile = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    ? '/admin/profile'
    : user?.role === 'INSTRUCTOR' ? '/instructor/profile' : '/student/profile';

  return (
    <>
      <nav style={navStyle}>
        <Container>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <img
                src={isScrolled ? (isDark ? logoLight : logoDark) : logoLight}
                alt="Jomar Segurid"
                style={{ height: isScrolled ? 55 : 65, width: "auto", transition: "all 0.5s ease" }}
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="d-none d-lg-flex align-items-center" style={{ gap: "4px" }}>
              {links.map((link) => {
                const isActive = pathname === link.href;

                if (link.type === 'mega') {
                  return (
                    <div key={link.href} ref={megaRef} style={{ position: "relative" }} onMouseEnter={handleMegaEnter} onMouseLeave={handleMegaLeave}>
                      <button onClick={() => setMegaOpen(!megaOpen)} style={{
                        color: isScrolled ? (isActive ? "var(--clr-primary)" : "var(--clr-text)") : (isActive ? "#fff" : "rgba(255,255,255,0.8)"),
                        fontSize: "0.82rem", fontWeight: 700, padding: "10px 18px", borderRadius: "12px",
                        background: isActive && !isScrolled ? "rgba(255,255,255,0.1)" : (isActive && isScrolled ? "var(--clr-primary-alpha)" : "transparent"),
                        border: "none", cursor: "pointer", transition: "all 0.3s ease", display: "flex", alignItems: "center", gap: "4px",
                      }}>
                        {link.label} <i className={`bi bi-chevron-${megaOpen ? 'up' : 'down'}`} style={{ fontSize: "0.6rem" }} />
                      </button>

                      <div style={{
                        position: "absolute", top: "100%", left: "-60px", marginTop: "12px", width: "480px",
                        background: "var(--clr-bg-light)", borderRadius: "16px", border: "1px solid var(--clr-border)",
                        boxShadow: "var(--shadow-xl)", padding: "20px", opacity: megaOpen ? 1 : 0,
                        pointerEvents: megaOpen ? "auto" : "none", transform: megaOpen ? "translateY(0)" : "translateY(-8px)",
                        transition: "all 0.25s ease", zIndex: 100,
                      }}>
                        <div className="mb-3">
                          <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--clr-muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px", paddingLeft: "8px" }}>Cursos de Formación</div>
                          {cursos.map(c => (
                            <Link key={c.slug} href={`/formacion/${c.slug}`} onClick={() => setMegaOpen(false)} style={{
                              display: "flex", alignItems: "center", gap: "12px", padding: "10px 8px", borderRadius: "10px", textDecoration: "none", color: "var(--clr-text)", transition: "background 0.15s ease",
                            }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--clr-primary-alpha)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--clr-primary-alpha)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--clr-primary)", fontSize: "0.9rem", flexShrink: 0 }}>
                                <i className={`bi ${c.icono}`} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{c.nombre}</div>
                                <div style={{ fontSize: "0.72rem", color: "var(--clr-muted)", lineHeight: 1.3 }}>{c.duracion} · {c.modalidad === 'presencial' ? 'Presencial' : c.modalidad}</div>
                              </div>
                            </Link>
                          ))}
                        </div>

                        <div style={{ height: "1px", background: "var(--clr-border)", margin: "4px 0 12px" }} />

                        <div>
                          <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--clr-muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px", paddingLeft: "8px" }}>Servicios Corporativos</div>
                          {servicios.map(s => (
                            <Link key={s.slug} href="/programas" onClick={() => setMegaOpen(false)} style={{
                              display: "flex", alignItems: "center", gap: "12px", padding: "10px 8px", borderRadius: "10px", textDecoration: "none", color: "var(--clr-text)", transition: "background 0.15s ease",
                            }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--clr-primary-alpha)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--clr-primary-alpha)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--clr-primary)", fontSize: "0.9rem", flexShrink: 0 }}>
                                <i className={`bi ${s.icono}`} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{s.nombre}</div>
                                <div style={{ fontSize: "0.72rem", color: "var(--clr-muted)" }}>Cotización personalizada</div>
                              </div>
                            </Link>
                          ))}
                        </div>

                        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--clr-border)" }}>
                          <Link href="/programas" onClick={() => setMegaOpen(false)} className="btn-brand w-100" style={{ justifyContent: "center", padding: "10px", fontSize: "0.8rem" }}>
                            Ver catálogo completo
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link key={link.href} href={link.href} style={{
                    color: isScrolled ? (pathname === link.href ? "var(--clr-primary)" : "var(--clr-text)") : (pathname === link.href ? "#fff" : "rgba(255,255,255,0.8)"),
                    fontSize: "0.82rem", fontWeight: 700, padding: "10px 18px", borderRadius: "12px", textDecoration: "none", transition: "all 0.3s ease",
                    background: pathname === link.href && !isScrolled ? "rgba(255,255,255,0.1)" : (pathname === link.href && isScrolled ? "var(--clr-primary-alpha)" : "transparent"),
                    position: "relative" as const,
                  }}>
                    {link.label}
                    {pathname === link.href && (
                      <span style={{ position: "absolute", bottom: "2px", left: "50%", transform: "translateX(-50%)", width: "20px", height: "2px", background: isScrolled ? "var(--clr-primary)" : "#fff", borderRadius: "1px" }} />
                    )}
                  </Link>
                );
              })}

              {/* Theme Toggle */}
              <button onClick={toggleTheme} style={{
                background: isScrolled ? "var(--clr-primary-alpha)" : "rgba(255,255,255,0.1)", border: "none",
                color: isScrolled ? "var(--clr-primary)" : "#fff", width: "36px", height: "36px", borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "10px", transition: "all 0.3s ease",
              }}>
                <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`} style={{ fontSize: "0.9rem" }} />
              </button>

              {!user ? (
                <Link href="/login" className={`btn-portal-hover ${isScrolled ? "btn-brand ms-3" : "btn-brand-on-dark ms-3"}`} style={{ padding: "10px 24px", borderRadius: "14px", fontSize: "0.85rem", boxShadow: "none" }}>
                  Mi Portal <i className="bi bi-box-arrow-in-right ms-2" />
                </Link>
              ) : (
                <div
                  ref={userMenuRef}
                  style={{ position: 'relative' }}
                  className="ms-3"
                  onMouseEnter={handleUserMenuEnter}
                  onMouseLeave={handleUserMenuLeave}
                >
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`btn-portal-hover ${isScrolled ? "btn-brand" : "btn-brand-on-dark"}`}
                    style={{ padding: "10px 24px", borderRadius: "14px", fontSize: "0.85rem", boxShadow: "none", display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}
                  >
                    <span className="d-none d-xl-inline">Hola, {user.firstName || 'Usuario'}</span>
                    <i className="bi bi-person-circle" />
                    <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                  </button>

                  {/* Dropdown — paddingTop crea el puente invisible entre botón y menú */}
                  <div style={{
                    position: 'absolute', top: '100%', right: 0,
                    paddingTop: '12px',
                    width: '220px',
                    opacity: userMenuOpen ? 1 : 0,
                    pointerEvents: userMenuOpen ? 'auto' : 'none',
                    transform: userMenuOpen ? 'translateY(0)' : 'translateY(-8px)',
                    transition: 'all 0.25s ease',
                    zIndex: 100,
                  }}>
                    <div style={{ background: 'var(--clr-bg-light)', borderRadius: '16px', border: '1px solid var(--clr-border)', boxShadow: 'var(--shadow-xl)', padding: '8px' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--clr-border)', marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--clr-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Mi Cuenta</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--clr-text)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                      </div>

                      <Link href={userDashboard} onClick={() => setUserMenuOpen(false)} className="dropdown-item-hover"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: 'var(--clr-text)', fontSize: '0.85rem', fontWeight: 600 }}>
                        <i className="bi bi-speedometer2" /> Ir a Dashboard
                      </Link>

                      <Link href={userProfile} onClick={() => setUserMenuOpen(false)} className="dropdown-item-hover"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: 'var(--clr-text)', fontSize: '0.85rem', fontWeight: 600 }}>
                        <i className="bi bi-person-gear" /> Mi Perfil
                      </Link>

                      <div style={{ height: '1px', background: 'var(--clr-border)', margin: '8px 0' }} />

                      <button onClick={() => { logout(); setUserMenuOpen(false); }} className="dropdown-item-danger-hover"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'transparent', color: '#EF4444', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                        <i className="bi bi-box-arrow-right" /> Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Toggle */}
            <div className="d-flex align-items-center d-lg-none gap-2">
              <button onClick={toggleTheme} style={{
                background: isScrolled ? "var(--clr-primary-alpha)" : "rgba(255,255,255,0.1)", border: "none",
                color: isScrolled ? "var(--clr-primary)" : "#fff", width: "40px", height: "40px", borderRadius: "10px",
              }}>
                <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`} />
              </button>
              <button onClick={() => setOpen(!open)} style={{
                background: isScrolled ? "var(--clr-primary-alpha)" : "rgba(255,255,255,0.1)",
                border: "none", borderRadius: "12px", width: "45px", height: "45px", color: isScrolled ? "var(--clr-primary)" : "#fff",
              }}>
                <i className={`bi bi-${open ? "x-lg" : "list"}`} style={{ fontSize: "1.6rem" }} />
              </button>
            </div>
          </div>
        </Container>
      </nav>

      {/* Mobile Overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2050, backdropFilter: "blur(4px)" }} />
      )}

      {/* Mobile Drawer */}
      <div style={{
        position: "fixed", top: 0, right: open ? 0 : "-100%", width: "100%", maxWidth: "320px", height: "100%",
        background: "var(--clr-bg)", zIndex: 2100, transition: "right 0.5s cubic-bezier(0.16, 1, 0.3, 1)", padding: "40px 24px",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.1)", overflowY: "auto",
      }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <img src={isDark ? logoLight : logoDark} alt="Jomar" style={{ height: "40px" }} />
          <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", fontSize: "1.5rem", color: "var(--clr-text)" }}><i className="bi bi-x-lg" /></button>
        </div>

        <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--clr-muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>Cursos</div>
        {cursos.map(c => (
          <Link key={c.slug} href={`/formacion/${c.slug}`} onClick={() => setOpen(false)} style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", textDecoration: "none", color: "var(--clr-text)", fontSize: "0.9rem", fontWeight: 600,
          }}>
            <i className={`bi ${c.icono}`} style={{ color: "var(--clr-primary)" }} /> {c.nombre}
          </Link>
        ))}

        <div style={{ height: "1px", background: "var(--clr-border)", margin: "12px 0" }} />

        <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--clr-muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>Secciones</div>
        {links.filter(l => l.type === 'link').map(link => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)} style={{
            display: "block", color: "var(--clr-text)", padding: "12px 10px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, fontSize: "0.95rem",
          }}>
            {link.label}
          </Link>
        ))}

        {!user ? (
          <Link href="/login" className="btn-brand mt-3 w-100" style={{ justifyContent: "center" }}>
            Acceder <i className="bi bi-box-arrow-in-right ms-2" />
          </Link>
        ) : (
          <Link href={userDashboard} className="btn-brand mt-3 w-100" style={{ justifyContent: "center" }}>
            Mi Panel <i className="bi bi-speedometer2 ms-2" />
          </Link>
        )}
      </div>
    </>
  );
}