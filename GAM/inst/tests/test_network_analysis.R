context("Network analysis")

heinz.py <- "/usr/local/lib/heinz/heinz.py"
heinz2 <- "/usr/local/lib/heinz2/heinz"
gmwcs <- "/usr/local/bin/gmwcs"

library(GAM.db)
library(GAM.networks)
data("kegg.mouse.network")
data(examplesGAM)
library(igraph)


if (file.exists(heinz.py)) {
    test_that("runHeinz works", {
        met.nt <- data.frame(ID=c("C01", "C02", "C03"), score=c(1, 1, 1), stringsAsFactors=F)
        
        et <- data.frame(
            met.x=c("C01", "C02"),
            met.y=c("C02", "C03"),
            rxn=c("R01", "R02"),
            score=c(1, -10),
            stringsAsFactors=F)
        
        g <- GAM:::graph.from.tables(node.table=list(met=met.nt), edge.table=et, directed=F)
        
        module <- GAM:::runHeinz(g, heinz.py, score.nodes=T, score.edges=T)[[1]]
        
        expect_equivalent(V(module)$name, c("C01", "C02"))
    })
}

es.M0.M1.full.rn.cr <- makeExperimentSet(network=kegg.mouse.network, 
                                         met.de=met.de.M0.M1,
                                         gene.de=gene.de.M0.M1,
                                         reactions.as.edges=F, collapse.reactions=T, plot=F)

es.M0.M1.full.rn <- makeExperimentSet(network=kegg.mouse.network, 
                                      met.de=met.de.M0.M1,
                                      gene.de=gene.de.M0.M1,
                                      reactions.as.edges=F, collapse.reactions=F, plot=F)

es.M0.M1.full.re.rp <- makeExperimentSet(network=kegg.mouse.network,
                                         met.de=met.de.M0.M1,
                                         gene.de=gene.de.M0.M1,
                                         reactions.as.edges=T, use.rpairs=T, plot=F)

es.M0.M1.full.re <- makeExperimentSet(network=kegg.mouse.network,
                                      met.de=met.de.M0.M1,
                                      gene.de=gene.de.M0.M1,
                                      reactions.as.edges=T, use.rpairs=F, plot=F)

test_that("makeExperimentSet works with full data", {
    
})

test_that("makeExperimentSet works without metabolic data", {
    es.M0.M1 <- makeExperimentSet(network=kegg.mouse.network, 
                                  gene.de=gene.de.M0.M1,
                                  reactions.as.edges=F, collapse.reactions=T, plot=F)

    es.M0.M1 <- makeExperimentSet(network=kegg.mouse.network, 
                                  gene.de=gene.de.M0.M1,
                                  reactions.as.edges=F, collapse.reactions=F, plot=F)
    
    es.M0.M1 <- makeExperimentSet(network=kegg.mouse.network,
                                  gene.de=gene.de.M0.M1,
                                  reactions.as.edges=T, use.rpairs=T, plot=F)
    
    c1 <- "C00040"
    c2 <- "C00264"
    expect_true(c1 %in% V(es.M0.M1$subnet)$name)
    expect_true(c2 %in% V(es.M0.M1$subnet)[nei(c1)]$name)
    
    
    es.M0.M1 <- makeExperimentSet(network=kegg.mouse.network,
                                  gene.de=gene.de.M0.M1,
                                  reactions.as.edges=T, use.rpairs=F, plot=F)
})

test_that("makeExperimentSet works without genomic data", {
    es.M0.M1 <- makeExperimentSet(network=kegg.mouse.network, 
                                  met.de=met.de.M0.M1,
                                  reactions.as.edges=F, plot=F)
    
    expect_true(length(E(es.M0.M1$subnet)[adj("C05528")]) > 0)
    
    es.M0.M1 <- makeExperimentSet(network=kegg.mouse.network,
                                  met.de=met.de.M0.M1,
                                  reactions.as.edges=T, use.rpairs=T, plot=F)
    
    es.M0.M1 <- makeExperimentSet(network=kegg.mouse.network,
                                  met.de=met.de.M0.M1,
                                  reactions.as.edges=T, use.rpairs=F, plot=F)
})

test_that("scoreNetwork works", {
    es.M0.M1.scored <- scoreNetwork(es.M0.M1.full.rn.cr)
    es.M0.M1.scored <- scoreNetwork(es.M0.M1.full.rn)
    es.M0.M1.full.re.rp.scored <- scoreNetwork(es.M0.M1.full.re.rp)
    expect_true("score" %in% list.edge.attributes(es.M0.M1.full.re.rp.scored$subnet.scored))
    expect_true("score" %in% list.vertex.attributes(es.M0.M1.full.re.rp.scored$subnet.scored))
    es.M0.M1.scored <- scoreNetwork(es.M0.M1.full.re)
    expect_true("score" %in% list.edge.attributes(es.M0.M1.scored$subnet.scored))
})

test_that("scoreNetworkWithoutBUM works", {
    es.M0.M1.scored <- scoreNetworkWithoutBUM(es.M0.M1.full.rn.cr)
    es.M0.M1.scored <- scoreNetworkWithoutBUM(es.M0.M1.full.rn)
    es.M0.M1.scored <- scoreNetworkWithoutBUM(es.M0.M1.full.re.rp)
    es.M0.M1.scored <- scoreNetworkWithoutBUM(es.M0.M1.full.re)
    
})


test_that("findModule works", {
    module <- findModule(es.M0.M1.full.re.rp, solver=randHeur.solver(10))    
    expect_true(all(c("Citrate", "Itaconate", "L-Citrulline") %in% V(module)$label))
})

test_that("heinz.solver works", {
    if (file.exists(heinz.py)) {
        module <- findModule(es.M0.M1.full.rn.cr, solver=heinz.solver(heinz.py, timeLimit=30), num.positive=50)
        expect_true("Irg1" %in% V(module)$label)
    } else {
        warning("heinz solver not found")
    }
})

test_that("heinz2.solver works", { 
    if (file.exists(heinz2)) {
        module <- findModule(es.M0.M1.full.rn.cr, solver=heinz2.solver(heinz2, timeLimit=10))
        expect_true("Irg1" %in% V(module)$label)
    } else {
        warning("heinz2 solver not found")
    }    
})

test_that("heinz2.solver kind of works for edge-weighted instances", { 
    if (file.exists(heinz2)) {
        module <- findModule(es.M0.M1.full.re.rp, solver=heinz2.solver(heinz2, timeLimit=10))
        expect_true("Irg1" %in% E(module)$label)
    } else {
        warning("heinz2 solver not found")
    }    
})

test_that("gmwcs works for edge-weighted instances", { 
    if (file.exists(gmwcs)) {
        module <- findModule(es.M0.M1.full.re.rp, solver=gmwcs.solver(gmwcs, timeLimit=10))
        expect_true("Irg1" %in% E(module)$label)
    } else {
        warning("gmwcs solver not found")
    }
})
