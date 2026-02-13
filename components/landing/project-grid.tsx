import { motion } from "framer-motion";

const projects = [
  {
    name: "Residência Aurora",
    location: "Alphaville, SP",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA8DmbXHWnFRx9HxLakzPyNurJA72UzcVOvQQEBJqvLxnyCcZeKjX1aXtrBDlXVEaKi49al2DZGMd2ur1D_-Jzoszo_rG7WhvAcJU1jZHR1fY0XtuYvxQE6etY5f1_4bQ_nszNI7JNfvPJ-mPrD900yFW47Iwnr22abQx1dR3PCkmaldJj9XTbNZuL0gppYAHJwDGJ4O3-8TLdIXjtEKGTSIbUrlsrFYM-P0kjU2emLbko53Z4_5_fCNiUVrl2ShrZGxRJZBRMwDrL8",
  },
  {
    name: "Edifício Horizonte",
    location: "Itaim Bibi, SP",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB1BBXAC9cxWtr_xxq6GMheh1UPMH7QOxjVXSxQMxBDlikGJlY7tcI8lLgR1phw-5h0LupLOK0buFsedKQd_HhLx_ot54xJ74x-QU43v_Vv_PGsGWt3AjxViGN79yfdq8UcyPOgE51HrOIMiE0hca5CUMZVPgdT4rbFNrg2aNk3hgNC7EHMhLfE7v1VHieW_Jm5GbXhcbToyZnqG_Ywfot5vZzy0oD7UAfDmKZ3WPAb6EiDMEUdVQqtNHN8ChonOHFid74Qa5MZguOO",
  },
  {
    name: "Loft Industrial",
    location: "Lapa, RJ",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCEFDr73BPGE09f2fzelh2zX730l7a3m3Qpst4iN6IVL0ZpJa0b3tZO6dF5GFwLDt7GC5EpG4D9mW3iL0Eb3Wo9mOIzpI5nNqIpHHDZU0M5M6AM6uk4zZeXIXVRUMSx-QPgfNoDIn9JX3pOd5lmdHtrTDNWyGdKWfa0_KRgDwFMAnPxgwg4l1YH55RALHwoMCnmhBJwnWaX6KRWnldYsBM4rQrLu0etItQtd7amvmvoxq83hLsupAAqxZuUe0SpI_J7z6TBSbqwM7wj",
  },
];

export function ProjectGrid() {
  return (
    <section id="projetos" className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-[600px]">
            <motion.h2
              className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              Projetos em <br />
              Destaque
            </motion.h2>
            <motion.p
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Conheça alguns dos projetos que transformamos em realidade.
            </motion.p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              className="flex flex-col gap-4 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="relative w-full aspect-video bg-center bg-no-repeat bg-cover rounded-xl overflow-hidden cursor-pointer border border-border">
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="font-bold">{project.name}</span>
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {project.location}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
